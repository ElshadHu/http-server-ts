import { HttpStatusCode, getStatusMessage } from "../models/StatusCode";

export class StatusLine {
    private readonly version: string = "HTTP/1.1";
    private code : HttpStatusCode = HttpStatusCode.OK;
    private message: string = getStatusMessage(HttpStatusCode.OK);

    set(code: HttpStatusCode, message?: string): this {
        this.code = code;
        this.message = message ?? getStatusMessage(code);
        return this;
    }

    toString() {
        return `${this.version} ${this.code} ${this.message}\r\n`;
    }
}