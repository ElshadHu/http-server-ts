import { Middleware } from "./types";

export const LoggerMiddleware: Middleware = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

console.log(`${timestamp}: ${req.method} ${req.path}`);

const originalToString = res.toString.bind(res);

res.toString = function(): string {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    
    console.log(
            `${timestamp} ${req.method} ${req.path} - ${status} (${duration})`
        );
    return originalToString();
  };
  next();
};
