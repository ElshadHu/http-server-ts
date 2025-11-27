import { HttpServer } from "./server/httpServer";
import { registerRoutes } from "./routes";

import { ErrorHandlerMiddleware } from "./http/middleware/errorhandlermiddleware";
import { LoggerMiddleware } from "./http/middleware/loggerMiddleware";
import { BodyParserMiddleware } from "./http/middleware/bodyParserMiddleware";

const server = new HttpServer({
    host: '127.0.0.1',
    port: 8080,
    keepAlive: {
        enabled: true,
        timeout: 60000,
        maxRequests:100
    }
});

server.use(ErrorHandlerMiddleware);
server.use(LoggerMiddleware);
server.use(BodyParserMiddleware);

registerRoutes(server);
server.start();

process.on('SIGINT', () => {
    console.log('\n Shutting down gracefully');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n Shutting down gracefully');
    process.exit(0);
})