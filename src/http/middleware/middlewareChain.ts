import { Middleware } from "./types";
import { HttpRequest } from "../models/request";
import { HttpResponse } from "../models/response";

export class MiddlewareChain {
    private middlewares: Middleware[] = [];

    use(middware: Middleware): void {
        this.middlewares.push(middware);
    }

    run(req: HttpRequest, res: HttpResponse): void {
        let i = 0;
        const next = () => {
            if(i < this.middlewares.length) {
               const middleware = this.middlewares[i++];
           if (!middleware) {
                throw new Error("Undefined middleware detected at position " + (i - 1));
            }
            middleware(req,res,next);
        };
        next();
    }
  }
}