import { HttpRequest } from "../http/models/request";
import { HttpResponse } from "../http/models/response";
import { HttpStatusCode } from "../http/models/StatusCode";
import { HttpServer } from "../server/httpServer";

export function registerRoutes(server: HttpServer): void {
    // GET
    server.get('/', (req:HttpRequest, res:HttpResponse)=> {
        res.setHtmlBody('<h1>HTTP Server</h1><p>Server is running</p>');
    });
    // GET /status
    server.get('/status', (req: HttpRequest, res:HttpResponse) => {
        res.setJsonBody({
            status: 'running',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            pid: process.pid
        });
    });

    server.post('/api/users', (req: HttpRequest, res: HttpResponse) => {
       if(!req.parsedBody) {
         res.setStatus(HttpStatusCode.BAD_REQUEST);
         res.setJsonBody({error: 'No body provided'});
         return;
       }
       const name = req.parsedBody.name;
       const age = req.parsedBody.age;

       const ageNum = typeof age === 'string' 
       ? parseInt(age,10)
       : typeof age === 'number'
       ? age
       : NaN

       if( typeof name !== 'string' || isNaN(ageNum)) {
         res.setStatus(HttpStatusCode.BAD_REQUEST);
         res.setJsonBody({error: 'Invalid data types'});
         return;
       }
       res.setStatus(HttpStatusCode.CREATED);
       res.setJsonBody({
         message: 'User created',
         user: {name,age: ageNum}
       });
    }); 
}