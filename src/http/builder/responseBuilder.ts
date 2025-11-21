import { StatusLine } from "./StatusLine";
import { HeaderBuilder } from "./headerBuilder";
import { HttpStatusCode } from "../models/StatusCode";

export class ResponseBuilder {
    private statusLine = new StatusLine();
    private headers = new HeaderBuilder();
    private body = "";

    setStatus(code: HttpStatusCode, message?: string): this {
        this.statusLine.set(code,message);
        return this;
    }

    setHeader(name: string, value: string): this {
        this.headers.set(name,value);
        return this;
    }
    setBody(body: string): this {
        this.body = body;
        return this;
    }
    build(): string {
        if(!this.headers.get('Content-Length') && this.body) {
            this.setHeader('Content:Length',
            Buffer.byteLength(this.body).toString());
          }
            return(
                this.statusLine.toString() +
                this.headers.toString() +
                "\r\n" + this.body
            );
    }
}