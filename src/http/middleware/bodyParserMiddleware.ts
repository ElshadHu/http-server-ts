import { Middleware } from "./types";
import { HttpStatusCode } from "../models/StatusCode";

export const BodyParserMiddleware: Middleware = (req, res, next) => {
    if (!req.body || req.body.trim().length === 0) {
        next(); 
        return;
    }

    const contentTypeValue = req.headers.get("Content-Type");
    const contentType = contentTypeValue 
        ? contentTypeValue.split(";")[0]?.trim().toLowerCase()
        : undefined;

    if (contentType === "application/json") {
        try {
            req.parsedBody = JSON.parse(req.body);
            next();
            return;
            
        } catch (err) {
            res.setStatus(HttpStatusCode.BAD_REQUEST); 
            res.headers.setContentType("text/plain");
            res.setBody("Invalid JSON body shi");
            return;
        }
    }

    if (contentType === "application/x-www-form-urlencoded") {
        try {
            req.parsedBody = Object.fromEntries(
                req.body.split("&").map(pair => {
                    const [key, value] = pair.split("=");
                    
                    // Handle missing key or value
                    return [
                        decodeURIComponent(key || ""),
                        decodeURIComponent(value || "")
                    ];
                })
            );
            
            next();
            return;
            
        } catch (err) {
            res.setStatus(HttpStatusCode.BAD_REQUEST);
            res.headers.setContentType("text/plain");
            res.setBody("Invalid form data");
            return;
        }
    }
    next(); 
};