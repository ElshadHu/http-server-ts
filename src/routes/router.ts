import { HttpRequest } from "../http/models/request";
import { HttpResponse } from "../http/models/response";
import { IConnection } from "../network/types";

type RouteHandler = (
  req: HttpRequest,
  res: HttpResponse,
  connection?: IConnection
) => void | Promise<void>;

export class Router {
  private routes: Array<{
    method: string;
    path: string;
    handler: RouteHandler;
    segments: string[];
  }> = [];

  get(path: string, handler: RouteHandler): void {
    this.addRoute("GET", path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.addRoute("POST", path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.addRoute("PUT", path, handler);
  }
  delete(path: string, handler: RouteHandler): void {
    this.addRoute("DELETE", path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.addRoute("PATCH", path, handler);
  }

  private addRoute(method: string, path: string, handler: RouteHandler): void {
    const segments =
      path === "*" ? ["*"] : path.split("/").filter(stringSegment => stringSegment.length > 0);
    this.routes.push({ method, path, handler, segments });
    console.log(`Router: ${method} ${path}`);
  }

  match(
    method: string,
    url: string
  ): { handler: RouteHandler; params: Record<string, string> } | null {
    const pathname = url.split("?")[0];
    const requestSegments = pathname
      ?.split("/")
      .filter(requestSegment => requestSegment.length > 0);

    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) {
        continue;
      }

      if (route.path === "*") {
        return { handler: route.handler, params: {} };
      }
      if (!requestSegments) {
        return null;
      }
      const matchResult = this.matchSegments(route.segments, requestSegments);
      if (matchResult) {
        return { handler: route.handler, params: matchResult };
      }
    }
    return null;
  }

  private matchSegments(
    routeSegments: string[],
    requestSegments: string[]
  ): Record<string, string> | null {
    if (routeSegments.length !== requestSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSeg = routeSegments[i];
      const requestSeg = requestSegments[i];

      if (routeSeg?.startsWith(":")) {
        const paramName = routeSeg.slice(1);
        params[paramName] = requestSeg || "";
      } else if (routeSeg !== requestSeg) {
        return null;
      }
    }

    return params;
  }

  printRoutes(): void {
    console.log("\nRoutes:");
    this.routes.forEach(r => console.log(`  ${r.method} ${r.path}`));
    console.log("");
  }
}
