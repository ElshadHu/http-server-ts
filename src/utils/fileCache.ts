import * as crypto from "crypto";

/**
 * LRU (Least Recently Used) File Cache with ETag Support
 *
 * PURPOSE:
 * Stores frequently accessed files in memory to avoid repeated disk reads,
 * improving performance by serving cached content instead of reading from filesystem.
 *
 * HOW LRU WORKS:
 * - Maintains an array (accessOrder) tracking which files were accessed when
 * - Most recently used files are at the END of the array
 * - Least recently used files are at the START of the array
 * - When cache is full, removes files from the START (oldest/least used)
 * - Every get() moves that file to the END (marking it as recently used)
 * ETAG GENERATION:
 * - Creates MD5 hash of file content as ETag
 * - Used for HTTP 304 Not Modified responses
 * - Allows browsers to use their cached version if file unchanged
 */

export class FileCache {
  private cache = new Map<
    string,
    {
      content: Buffer;
      etag: string;
      lastModified: Date;
      size: number;
    }
  >();

  private accessOrder: string[] = [];
  private currentSize = 0;

  constructor(
    private maxSize: number = 10 * 1024 * 1024, //10 MB
    private maxFileSize: number = 100 * 1024 // 100KB per file
  ) {}

  get(path: string) {
    const entry = this.cache.get(path);
    if (entry) {
      // Move to end most recently used
      this.accessOrder = this.accessOrder.filter(pathSegment => pathSegment !== path);
      this.accessOrder.push(path);
    }
    return entry;
  }

  set(path: string, content: Buffer, lastModified: Date): void {
    if (content.length > this.maxFileSize) {
      console.log(`File ${path} too large bytes: ${content.length}`);
      return;
    }

    // Remove least recently used if needed
    while (this.currentSize + content.length > this.maxSize && this.accessOrder.length > 0) {
      const lruPath = this.accessOrder.shift();
      if (lruPath) {
        const lruEntry = this.cache.get(lruPath);
        if (lruEntry) {
          this.currentSize -= lruEntry.size;
          this.cache.delete(lruPath);
          console.log(`Removed ${lruPath} from cache (LRU)`);
        }
      }
    }

    const etag = this.generateETag(content);
    const entry = {
      content,
      etag,
      lastModified,
      size: content.length,
    };

    this.cache.set(path, entry);
    this.accessOrder.push(path);
    this.currentSize += content.length;
    console.log(`Cached ${path} (${content.length} bytes, ETag: ${etag})`);
  }

  private generateETag(content: Buffer): string {
    return `"${crypto.createHash("md5").update(content).digest("hex")}"`;
  }
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentSize = 0;
  }

  getStats() {
    return {
      entries: this.cache.size,
      totalSize: this.currentSize,
      maxSize: this.maxSize,
      hitRate: 0,
    };
  }
}
