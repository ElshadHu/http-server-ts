// Network
import { Listener } from './network/listener';
import { IConnection } from "./network/types";

// Http protocol
import { RequestParser } from './http/parser/requestParser';
import { HttpRequest } from './http/models/request';
import { HttpResponse } from './http/models/response';
import { HttpStatusCode } from './http/models/StatusCode';

// Middleware
import { MiddlewareChain } from './http/middleware/middlewareChain';
import { ErrorHandlerMiddleware } from './http/middleware/errorhandlermiddleware';
import { LoggerMiddleware } from './http/middleware/loggerMiddleware';
import { BodyParserMiddleware } from './http/middleware/bodyParserMiddleware';

// Set up TCP listener
const listener = new Listener({
    host: '127.0.0.1', 
    port: 8080 
});

// Setup Middleware chain
const middlewareChain = new MiddlewareChain();

middlewareChain.use(ErrorHandlerMiddleware);
middlewareChain.use(LoggerMiddleware);
middlewareChain.use(BodyParserMiddleware);

// Handle TCP Connections
listener.onConnection((conn: IConnection) => {
    console.log(`Client connected: ${conn.getId()}`);

    conn.setTimeout(30000);

    let buffer = Buffer.alloc(0);

    conn.onData(async (data: Buffer | string) => {
        try {
            const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
            buffer = Buffer.concat([buffer, chunk]);

            if (!hasCompleteHeaders(buffer)) {
                console.log('Waiting for complete request');
                return;
            }
            const request: HttpRequest = RequestParser.parse(buffer);
            console.log(`[HTTP] ${request.method} ${request.path}`);
            
            const response: HttpResponse = new HttpResponse();

            middlewareChain.run(request, response, () => { // next
                handleRequest(request, response);
            });
            // Serialize response to HTTP
            const responseSerialized = response.toString();
            // Send TCP bytes back
            await conn.write(responseSerialized);
            conn.close();
            buffer = Buffer.alloc(0);
        } catch (err) {
            console.error('[Error]', err);
            try {
                const errorResponse = new HttpResponse(HttpStatusCode.INTERNAL_SERVER_ERROR);
                errorResponse.setHtmlBody('<h1>500 Internal Server Error</h1>');
                await conn.write(errorResponse.toString());
            } catch {}
            conn.close();
        }
    });

    conn.onClose(() => {
        console.log(`Client disconnected: ${conn.getId()}`);
    });

    conn.onError((err) => {
        console.error('Connection error:', err);
    });
});

function handleRequest(req: HttpRequest, res: HttpResponse): void {

    if (req.method === 'GET' && req.path === '/') {
        res.setHtmlBody('<h1>HTTP Server</h1><p>Server is running</p>');
        return;
    }

    if (req.method === 'GET' && req.path === '/status') {
        res.setJsonBody({
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            pid: process.pid
        });
        return;
    }

    // POST /api/users
    if (req.method === 'POST' && req.path === '/api/users') {
        if (!req.parsedBody) {
            res.setStatus(HttpStatusCode.BAD_REQUEST);
            res.setJsonBody({ error: 'No body provided' });
            return;
        }

        const name = req.parsedBody.name;
        const age = req.parsedBody.age;

        const ageNum = typeof age === 'string' ? parseInt(age, 10) : typeof age === 'number' ? age : NaN;

        if (typeof name !== 'string' || isNaN(ageNum)) {
            res.setStatus(HttpStatusCode.BAD_REQUEST);
            res.setJsonBody({ error: 'Invalid data types' });
            return;
        }

        res.setStatus(HttpStatusCode.CREATED);
        res.setJsonBody({
            message: 'User created',
            user: { name, age: ageNum }
        });
        return;
    }
    res.setStatus(HttpStatusCode.NOT_FOUND);
    res.setHtmlBody('<h1>404 Not Found</h1>');
}

function hasCompleteHeaders(buffer: Buffer): boolean {
     return buffer.includes('\r\n\r\n');
}

listener.listen();
console.log('HTTP Server running on http://127.0.0.1:8080');