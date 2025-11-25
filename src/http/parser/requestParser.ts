import { HttpRequest, HttpMethod } from "../models/request";
import { RequestLine } from "./requestLine";
import { HeaderParser } from "./headerParser";
import { BodyParser } from "./bodyParser";
 /**
  * Parse complete HTTP request from buffer
  * 
  * Steps:
  * 1. Parse request line using RequestLine
  * 2. Parse headers using HeaderParser
  * 3. Parse body using BodyParser
  * 4. Parse query params (built into HttpRequest)
  * 
  * @returns Complete HttpRequest object
  */
export class RequestParser {


    static parse(buffer: Buffer): HttpRequest {
        const request = new HttpRequest();

        const rawRequest = buffer.toString('utf-8');
        request.rawRequest = rawRequest;

        const lines = rawRequest.split('\r\n');

        if(lines.length === 0) {
            throw new Error('Empty request buffer');
        }

        if(lines[0] === undefined) {
            throw new Error('line is undefined');
        }
        
        // Parse request Line
        const requestLineData = RequestLine.parse(lines[0]!);
        request.method = requestLineData.method as HttpMethod;
        request.path = requestLineData.path;
        request.version = requestLineData.version;

        // Parse headers
        let currentLine: number = 1;
        const headerLines: string[] = [];

        while(currentLine < lines.length) {
            const line = lines[currentLine];

            if(line === undefined || line.trim() === '') {
                break;
            }

            headerLines.push(line);
            currentLine++;
        }

        request.headers = HeaderParser.parseHeaders(headerLines);

        currentLine++;

        const headerEndMarker = `\r\n\r\n`;
        const headerEndIndex = rawRequest.indexOf(headerEndMarker);
        let bodyStartPosition: number;
        if(headerEndIndex !== -1) {
            bodyStartPosition = headerEndIndex + headerEndMarker.length;
        } else {
            bodyStartPosition = rawRequest.length;
        }
        const bodyResult = BodyParser.parse(buffer, request.headers, bodyStartPosition);
        request.body = bodyResult.body;

        //Parse query params if present
        
        if(requestLineData.query) {
            this.parseQueryParams(requestLineData.query,request);
        }
        
        return request;
    }
    
    private static parseQueryParams(queryString: string, request: HttpRequest): void {
        if(!queryString || queryString.trim().length === 0) {
            return;
        }
        const pairs = queryString.split('&');
        for(const pair of pairs) {
            const [key, value] = pair.split('=');
            if(key) {
                request.queryParams.set(
                    decodeURIComponent(key),
                    value ? decodeURIComponent(value) : ''
                );
            }
        }
    }


}