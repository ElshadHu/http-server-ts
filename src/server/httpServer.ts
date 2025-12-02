import { Listener } from "../network/listener";
import { IConnection } from "../network/types";
import { RequestBuffer } from "../network/requestBuffer";
import { KeepAliveManager } from "../network/keepAliveManager";
import { RequestParser } from "../http/parser/requestParser";
import { HttpRequest } from "../http/models/request";
import { HttpResponse } from "../http/models/response";
import { HttpStatusCode } from "../http/models/StatusCode";
import { MiddlewareChain } from "../http/middleware/middlewareChain";
import { Router } from "../routes/router";

export interface ServerConfig {
  host: string;
  port: number;
  keepAlive?: {
    enabled?: boolean;
    timeout?: number;
    maxRequests?: number;
  };
}

type Middleware = (req: HttpRequest, res: HttpResponse, next: () => void) => void;

// Discriminated union for route handlers
type SimpleRouteHandler = {
  type: "simple";
  handler: (req: HttpRequest, res: HttpResponse) => void | Promise<void>;
};

type ContextRouteHandler = {
  type: "context";
  handler: (
    req: HttpRequest,
    res: HttpResponse,
    context: {
      connection: IConnection;
      keepAliveManager: KeepAliveManager;
    }
  ) => void | Promise<void>;
};

type RouteHandler = SimpleRouteHandler | ContextRouteHandler;

interface ConnectionContext {
  connection: IConnection;
  requestBuffer: RequestBuffer;
  keepAliveManager: KeepAliveManager;
  response?: HttpResponse;
}
export class HttpServer {
  private listener: Listener;
  private middlewareChain: MiddlewareChain;
  private router: Router;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.listener = new Listener({
      host: config.host,
      port: config.port,
    });
    this.middlewareChain = new MiddlewareChain();
    this.router = new Router();
  }

  use(middleware: Middleware): void {
    this.middlewareChain.use(middleware);
  }

  // Simple handler (no context)
  get(path: string, handler: (req: HttpRequest, res: HttpResponse) => void | Promise<void>): void;
  // Context handler (with connection and keepAliveManager)
  get(path: string, handler: RouteHandler): void;
  get(path: string, handler: any): void {
    const wrappedHandler: RouteHandler =
      typeof handler === "function" ? { type: "simple", handler } : handler;
    this.router.get(path, wrappedHandler);
  }

  post(path: string, handler: (req: HttpRequest, res: HttpResponse) => void | Promise<void>): void;
  post(path: string, handler: RouteHandler): void;
  post(path: string, handler: any): void {
    const wrappedHandler: RouteHandler =
      typeof handler === "function" ? { type: "simple", handler } : handler;
    this.router.post(path, wrappedHandler);
  }

  put(path: string, handler: (req: HttpRequest, res: HttpResponse) => void | Promise<void>): void;
  put(path: string, handler: RouteHandler): void;
  put(path: string, handler: any): void {
    const wrappedHandler: RouteHandler =
      typeof handler === "function" ? { type: "simple", handler } : handler;
    this.router.put(path, wrappedHandler);
  }

  delete(
    path: string,
    handler: (req: HttpRequest, res: HttpResponse) => void | Promise<void>
  ): void;
  delete(path: string, handler: RouteHandler): void;
  delete(path: string, handler: any): void {
    const wrappedHandler: RouteHandler =
      typeof handler === "function" ? { type: "simple", handler } : handler;
    this.router.delete(path, wrappedHandler);
  }

  patch(path: string, handler: (req: HttpRequest, res: HttpResponse) => void | Promise<void>): void;
  patch(path: string, handler: RouteHandler): void;
  patch(path: string, handler: any): void {
    const wrappedHandler: RouteHandler =
      typeof handler === "function" ? { type: "simple", handler } : handler;
    this.router.patch(path, wrappedHandler);
  }

  start(): void {
    this.setupConnectionHandler();
    this.listener.listen();
    console.log(`HTTP Server running on http://${this.config.host}:${this.config.port}`);
    this.router.printRoutes();
  }

  private setupConnectionHandler(): void {
    this.listener.onConnection((conn: IConnection) => {
      console.log(`Client connected: ${conn.getId()}`);
      conn.setTimeout(this.config.keepAlive?.timeout ?? 60000);
      const context: ConnectionContext = {
        connection: conn,
        requestBuffer: new RequestBuffer(),
        keepAliveManager: new KeepAliveManager(this.config.keepAlive),
      };

      conn.onData(async (data: Buffer | string) => {
        try {
          await this.handleIncomingData(context, data);
        } catch (err) {
          await this.handleError(context.connection, err);
        }
      });

      conn.onClose(() => {
        console.log(`Client disconnected: ${conn.getId()}`);
        context.requestBuffer.reset();
      });
      conn.onError(err => {
        console.log(`Connection error ${err}`);
      });
    });
  }

  private async handleIncomingData(
    context: ConnectionContext,
    data: Buffer | string
  ): Promise<void> {
    const { connection, requestBuffer } = context;
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);

    if (requestBuffer.getSize() + chunk.length > 10 * 1024 * 1024) {
      if (connection.isAlive()) {
        const errorResponse = new HttpResponse(HttpStatusCode.TOO_LARGE_REQUEST);
        errorResponse.setHtmlBody("<h1>413 Request Too Large</h1>");
        await connection.write(errorResponse.toString());
      }
      connection.close();
      return;
    }
    requestBuffer.append(chunk);
    if (!requestBuffer.hasCompleteHeaders()) {
      return;
    }

    const buffer = requestBuffer.toBuffer();
    const request: HttpRequest = RequestParser.parse(buffer);
    console.log(`${request.method} ${request.path}`);

    const response: HttpResponse = new HttpResponse();
    context.response = response;

    this.middlewareChain.run(request, response, async () => {
      await this.handleRoute(request, response, context);
    });

    this.addKeepAliveHeaders(context);

    // Only send response if not already streamed
    if (!response.isStreamed) {
      await this.sendResponse(context);
    }

    this.manageConnectionLifecycle(context);

    requestBuffer.reset();
  }

  private addKeepAliveHeaders(context: ConnectionContext): void {
    const { response, keepAliveManager } = context;
    if (!response) return;

    response.headers.set("Connection", keepAliveManager.getConnectionHeader());
    if (keepAliveManager.shouldKeepAlive()) {
      response.headers.set("Keep-Alive", keepAliveManager.getKeepAliveHeader());
    }
  }

  private async sendResponse(context: ConnectionContext): Promise<void> {
    const { connection, response } = context;
    if (!response) return;
    const responseSerialized = response.toString();
    if (connection.isAlive()) {
      await connection.write(responseSerialized);
    }
  }
  private manageConnectionLifecycle(context: ConnectionContext): void {
    const { connection, keepAliveManager } = context;

    keepAliveManager.incrementRequests();
    if (!keepAliveManager.shouldKeepAlive() && connection.isAlive()) {
      console.log(`Closing after ${keepAliveManager.getStats().requestCount} requests`);
      connection.close();
    }
  }

  private async handleRoute(
    req: HttpRequest,
    res: HttpResponse,
    context: ConnectionContext
  ): Promise<void> {
    const match = this.router.match(req.method, req.path);
    if (match) {
      req.params = match.params;
      const routeHandler = match.handler;

      // Discriminated union: call handler based on type
      if (routeHandler.type === "simple") {
        await routeHandler.handler(req, res);
      } else {
        await routeHandler.handler(req, res, {
          connection: context.connection,
          keepAliveManager: context.keepAliveManager,
        });
      }
    } else {
      res.setStatus(HttpStatusCode.NOT_FOUND);
      res.setHtmlBody("<h1>404 Not Found</h1>");
    }
  }

  private async handleError(conn: IConnection, err: unknown): Promise<void> {
    console.log(`Error:: some shi ${err}`);
    try {
      if (conn.isAlive()) {
        const errorResponse = new HttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR);
        errorResponse.setHtmlBody("<h1>500 Internal Server Error</h1>");
        await conn.write(errorResponse.toString());
      }
    } catch {}
    if (conn.isAlive()) {
      conn.close();
    }
  }
}
