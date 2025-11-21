import { HttpRequest } from "../models/request";
import { HttpResponse } from "../models/response";

export type Middleware = (
    req: HttpRequest,
    res: HttpResponse,
    next: () => void
 ) => void;