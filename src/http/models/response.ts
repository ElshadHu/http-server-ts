import { Headers } from './headers';
import { HttpStatusCode, getStatusMessage } from './StatusCode';

export class HttpResponse {
    statusCode: HttpStatusCode;
    headers: Headers;
    body: string;
    version: string;

    constructor(statusCode: HttpStatusCode = HttpStatusCode.OK) {
        this.statusCode = statusCode;
        this.headers = new Headers();
        this.body = '';
        this.version = 'HTTP/1.1';

        //Set default headers

        this.headers.set('Date', new Date().toUTCString());
        this.headers.set('Server', 'CustomizedHTTP/1.0');
    }

    setStatus(code: HttpStatusCode): void {
        this.statusCode = code;
    }
    // set Resonse body and content-length

    setBody(body: string): void {
        this.body = body;
        this.headers.setContentLength(Buffer.byteLength(body));
    }

    //set json body

    setJsonBody(data: unknown): void {
        const json = JSON.stringify(data);
        this.setBody(json);
        this.headers.setContentType('application/json');
    }

    setHtmlBody(html: string): void {
        this.setBody(html);
        this.headers.setContentType('text/html; charset=utf-8');
    }

    toString(): string {
        const statusMessage = getStatusMessage(this.statusCode);
        let response = `${this.version} ${this.statusCode} ${statusMessage}\r\n`;

        response += this.headers.toString();
        response += '\r\n';
        response += this.body;
        return response;
    }
}