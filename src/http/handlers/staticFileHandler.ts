import * as fs from "fs";
import * as path from "path";
import { HttpRequest } from "../models/request";
import { HttpResponse } from "../models/response";
import { HttpStatusCode } from "../models/StatusCode";
import { getMimeType } from "../../utils/mimeTypes";
import { FileCache } from "../../utils/fileCache";
import { IConnection } from "../../network/types";
import { KeepAliveManager } from "../../network/keepAliveManager";

type FileContext = {
  filePath: string;
  request: HttpRequest;
  response: HttpResponse;
  connection: IConnection;
  keepAliveManager: KeepAliveManager;
};

/**
 * Static File Handler
 *
 * Serves static files with:
 * - LRU caching for files < 100KB
 * - Streaming for large files with backpressure control
 * - ETag support for 304 Not Modified
 * - Directory traversal protection
 */
export class StaticFileHandler {
  private fileCache = new FileCache();
  private readonly SIZE_THRESHOLD_CACHE = 100 * 1024; // 100KB
  private readonly CHUNK_SIZE_SMALL = 64 * 1024; // 64KB
  private readonly CHUNK_SIZE_LARGE = 256 * 1024; // 256KB

  constructor(private publicDirectory: string = "./public") {
    const resolvedPath = path.resolve(publicDirectory);
    console.log(`Static file handler initialized: ${resolvedPath}`);
  }

  async handle(
    request: HttpRequest,
    response: HttpResponse,
    context: {
      connection: IConnection;
      keepAliveManager: KeepAliveManager;
    }
  ): Promise<void> {
    console.log("[Static] handle called for", request.path);
    const requestedPath = this.normalizeRequestPath(request.path);
    const filePath = this.resolveFilePath(requestedPath);

    if (!this.isPathSafe(filePath)) {
      console.warn(` Directory traversal blocked: ${request.path}`);
      response.setStatus(HttpStatusCode.FORBIDDEN);
      response.setHtmlBody("<h1>403 Forbidden</h1><p>Access denied.</p>");
      return;
    }

    const fileContext: FileContext = {
      filePath,
      request,
      response,
      connection: context.connection,
      keepAliveManager: context.keepAliveManager,
    };

    // Try cache first
    const cachedFile = this.fileCache.get(filePath);
    if (cachedFile) {
      this.serveCachedFile(cachedFile, fileContext);
      return;
    }

    await this.serveFromDisk(fileContext);
  }

  private normalizeRequestPath(requestPath: string): string {
    if (requestPath === "/" || requestPath.endsWith("/")) {
      return path.join(requestPath, "index.html");
    }
    return requestPath;
  }

  private resolveFilePath(requestPath: string): string {
    const sanitizedPath = path.normalize(requestPath).replace(/^(\.\.[\/\\])+/, "");
    return path.join(this.publicDirectory, sanitizedPath);
  }

  private isPathSafe(absoluteFilePath: string): boolean {
    const resolvedBase = path.resolve(this.publicDirectory);
    const resolvedPath = path.resolve(absoluteFilePath);
    return resolvedPath.startsWith(resolvedBase);
  }

  private serveCachedFile(
    cachedFile: { content: Buffer; etag: string; lastModified: Date },
    context: FileContext
  ): void {
    console.log(` Cache hit: ${context.filePath}`);

    const clientETag = context.request.getHeader("If-None-Match");
    if (clientETag === cachedFile.etag) {
      console.log(` 304 Not Modified: ${context.filePath}`);
      context.response.setStatus(HttpStatusCode.NOT_MODIFIED);
      context.response.headers.set("ETag", cachedFile.etag);
      return;
    }

    context.response.setStatus(HttpStatusCode.OK);
    context.response.headers.setContentType(getMimeType(context.filePath));
    context.response.headers.set("ETag", cachedFile.etag);
    context.response.headers.set("Last-Modified", cachedFile.lastModified.toUTCString());
    context.response.headers.set("Cache-Control", "public, max-age=3600");
    context.response.setBody(cachedFile.content);
  }

  private async serveFromDisk(context: FileContext): Promise<void> {
    console.log(`📁 Reading from disk: ${context.filePath}`);

    try {
      const fileStats = await fs.promises.stat(context.filePath);

      if (!fileStats.isFile()) {
        this.sendNotFound(context.response);
        return;
      }

      const shouldCache = fileStats.size <= this.SIZE_THRESHOLD_CACHE;
      if (shouldCache) {
        await this.cacheAndServeSmallFile(fileStats, context);
      } else {
        await this.streamLargeFile(fileStats, context);
      }
    } catch (error) {
      this.handleFileError(error, context);
    }
  }

  private async cacheAndServeSmallFile(fileStats: fs.Stats, context: FileContext): Promise<void> {
    console.log(`Caching small file: ${context.filePath} (${fileStats.size} bytes)`);

    const fileContent = await fs.promises.readFile(context.filePath);
    this.fileCache.set(context.filePath, fileContent, fileStats.mtime);

    const cachedFile = this.fileCache.get(context.filePath);
    if (!cachedFile) {
      throw new Error("Failed to cache file");
    }

    const clientETag = context.request.getHeader("If-None-Match");
    if (clientETag === cachedFile.etag) {
      console.log(`304 Not Modified: ${context.filePath}`);
      context.response.setStatus(HttpStatusCode.NOT_MODIFIED);
      context.response.headers.set("ETag", cachedFile.etag);
      return;
    }

    console.log(`200 OK (cached): ${context.filePath}`);
    context.response.setStatus(HttpStatusCode.OK);
    context.response.headers.setContentType(getMimeType(context.filePath));
    context.response.headers.set("ETag", cachedFile.etag);
    context.response.headers.set("Last-Modified", fileStats.mtime.toUTCString());
    context.response.headers.set("Cache-Control", "public, max-age=3600");
    context.response.setBody(cachedFile.content);
  }

  private async streamLargeFile(fileStats: fs.Stats, context: FileContext): Promise<void> {
    console.log("[Static] streamLargeFile", context.filePath, fileStats.size);
    context.response.isStreamed = true;

    const fileETag = this.generateLargeFileETag(fileStats);
    const clientETag = context.request.getHeader("If-None-Match");

    if (clientETag === fileETag) {
      console.log(` 304 Not Modified (large file): ${context.filePath}`);
      context.response.setStatus(HttpStatusCode.NOT_MODIFIED);
      context.response.headers.set("ETag", fileETag);
      context.response.isStreamed = false;
      return;
    }

    console.log(` Streaming: ${context.filePath} (${fileStats.size} bytes)`);

    context.response.setStatus(HttpStatusCode.OK);
    context.response.headers.setContentType(getMimeType(context.filePath));
    context.response.headers.set("Content-Length", fileStats.size.toString());
    context.response.headers.set("Last-Modified", fileStats.mtime.toUTCString());
    context.response.headers.set("ETag", fileETag);
    context.response.headers.set("Cache-Control", "public, max-age=86400");

    // KeepAliveManager instead of hardcoding keep-alive
    context.response.headers.set("Connection", context.keepAliveManager.getConnectionHeader());
    if (context.keepAliveManager.shouldKeepAlive()) {
      context.response.headers.set("Keep-Alive", context.keepAliveManager.getKeepAliveHeader());
    }

    await context.connection.write(context.response.getHeaderString());

    const chunkSize = this.selectChunkSize(fileStats.size);
    await this.streamFileToConnection(context.filePath, chunkSize, context.connection);
  }

  private generateLargeFileETag(fileStats: fs.Stats): string {
    return `"${fileStats.size}-${fileStats.mtime.getTime()}"`;
  }

  private selectChunkSize(fileSize: number): number {
    const ONE_MB = 1024 * 1024;
    return fileSize >= ONE_MB ? this.CHUNK_SIZE_LARGE : this.CHUNK_SIZE_SMALL;
  }

  private async streamFileToConnection(
    filePath: string,
    chunkSize: number,
    connection: IConnection
  ): Promise<void> {
    const readStream = fs.createReadStream(filePath, { highWaterMark: chunkSize });

    return new Promise<void>((resolve, reject) => {
      readStream.on("data", async chunk => {
        if (!connection.isAlive()) {
          readStream.destroy();
          reject(new Error("Connection closed"));
          return;
        }

        readStream.pause();
        try {
          await connection.write(chunk);
          readStream.resume();
        } catch (writeError) {
          readStream.destroy();
          reject(writeError);
        }
      });

      readStream.on("end", () => {
        console.log(` Stream complete: ${filePath}`);
        resolve();
      });

      readStream.on("error", streamError => {
        console.error(` Stream error: ${streamError.message}`);
        readStream.destroy();
        reject(streamError);
      });
    });
  }

  private sendNotFound(response: HttpResponse): void {
    console.log(` 404: Resource not found`);
    response.setStatus(HttpStatusCode.NOT_FOUND);
    response.setHtmlBody("<h1>404 Not Found</h1><p>The requested resource was not found.</p>");
  }

  private handleFileError(error: unknown, context: FileContext): void {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      console.log(` File not found: ${context.filePath}`);
      context.response.setStatus(HttpStatusCode.NOT_FOUND);
      context.response.setHtmlBody("<h1>404 Not Found</h1>");
    } else {
      console.error(` Server error: ${context.filePath}`, nodeError);
      context.response.setStatus(HttpStatusCode.INTERNAL_SERVER_ERROR);
      context.response.setHtmlBody("<h1>500 Internal Server Error</h1>");
    }
  }

  getCacheStats() {
    return this.fileCache.getStats();
  }
}
