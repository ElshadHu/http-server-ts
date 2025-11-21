import { Headers } from './headers'

export enum HttpMethod {
    GET = 'GET',
    HEAD = 'HEAD',
    POST = 'POST',
    DELETE = 'DELETE',
    CONNECT = 'CONNECT',
    OPTIONS = 'OPTIONS',
    TRACE = 'TRACE',
    PATCH = 'PATCH'
}

export  class HttpRequest {
    method: HttpMethod;
    path: string;
    version: string;
    headers: Headers;
    body: string;
    parsedBody?: Record<string,unknown>
    rawRequest: string;

    queryParams: Map<string, string>;

    constructor() {
        this.method = HttpMethod.GET;
        this.path = '/';
        this.version = 'HTTP/1.1';
        this.headers = new Headers();
        this.body = '';
        this.rawRequest = '';
        this.queryParams = new Map();
    }

    // get header value 

    getHeader(name: string): string | undefined {
        return this.headers.get(name);
    }

    // set header value

    setHeader(name: string, value: string): void {
        this.headers.set(name, value);
    }
    // Parse quesy string from path
    // /api/user?id=125&name=Elshad -> /api/users, params: {id:125,name:Elshad}
    parseQueryString(): void {
        const questionMarkIndex = this.path.indexOf('?');
        if(questionMarkIndex === -1) return;

        const queryString = this.path.substring(questionMarkIndex + 1);
        this.path = this.path.substring(0, questionMarkIndex);

        const pairs = queryString.split('&');
        for(const pair of pairs) {
            const[key,value] = pair.split('=');
            if(key) {
                this.queryParams.set(
                    decodeURIComponent(key),
                    value ? decodeURIComponent(value) : ''
                );
            }
        }
    }

    getQueryParam(name: string): string | undefined {
        return this.queryParams.get(name);
    }
    // string representation
    toString(): string {
        return `${this.method} ${this.path} ${this.version}`;
    }
}