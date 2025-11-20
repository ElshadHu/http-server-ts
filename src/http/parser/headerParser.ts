import { Headers } from "../models/headers";
import { parseLine } from "./re"
export class HeaderParser {
    
    static parseSingleHeader(line: string): ParsedHeader | null {
        const colonIndex = line.indexOf(':');
        if(colonIndex === -1) return null;

        const name = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        return {name,value};
    }

    static parseHeaders(lines: string[]): Headers {
        const headers = new Headers();
        for(const line of lines) {
            const parsed = this.parseSingleHeader(line);
            if(parsed) {
                headers.set(parsed.name, parsed.value);
            }
        }

        return headers;
    }


}