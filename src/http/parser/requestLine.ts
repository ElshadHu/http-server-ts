/**
 * Parses the first line of an HTTP request: METHOD / path HTTP/version
 * Output  {method: 'GET', path: '/api/users', version: 'HTTP/1.1'}
 * *HTTP Request Line Format:
 * - METHOD: HTTP verb (GET, POST, PUT, DELETE, etc.)
 * - URI: The path and query string (/path?query=value)
 * - VERSION: HTTP protocol version (HTTP/1.1, HTTP/1.0)
 * 
 */


export interface ParsedRequestLine {
    method: string;
    uri: string;
    path: string;
    query: string;
    version: string;
}

export class RequestLine {
    private static readonly VALID_METHODS = [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 
    'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'
    ];

    private static readonly HTTP_VERSION_REGEX = /^HTTP\/\d\.\d$/;

     static parse(line: string): ParsedRequestLine {
        const parts = line.split(' ');

        if(parts.length !== 3) {
            throw new Error(`Invalid request line: expected 3 parts but got ${parts.length}`);
        }

        const [method, uri, version] = parts;

        if (method == undefined || uri == undefined || version == undefined) {
            throw new Error(`Some shi is undefined`);
        }

        this.validateMethod(method);
        this.validateVersion(version);

        const { path, queryString } = this.parseURI(uri);

        return {
            method: method.toUpperCase(),
            uri,
            path,
            query: queryString,
            version
        };
     }

     private static parseURI(uri: string): {path: string, queryString: string} {
         const queryMarkIndex = uri.indexOf('?');

         if(queryMarkIndex === -1) {
            return {path: uri, queryString: ''};
         }

         return {
            path: uri.substring(0, queryMarkIndex),
            queryString: uri.substring(queryMarkIndex + 1)
         };
     }

     private static validateMethod(method: string): void {
        const upperMethod = method.toUpperCase();
        if (!this.VALID_METHODS.includes(upperMethod)) {
            throw new Error(`Invalid HTTP method: ${method}`);
        }
     }

     private static validateVersion(version: string): void {
        if(!this.HTTP_VERSION_REGEX.test(version)) {
            throw new Error(`Invalid HTTP version: ${version}`);
        }
     }
       

}
