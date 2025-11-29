import { Headers } from "../models/headers";

export interface BodyParseResult {
  body: string;
  bytesConsumed: number;
}

export class BodyParser {
  static parse(buffer: Buffer, headers: Headers, startPosition: number = 0): BodyParseResult {
    const contentLength = headers.getContentLength();

    if (!contentLength || contentLength === 0) {
      return {
        body: "",
        bytesConsumed: 0,
      };
    }

    const availableBytes = buffer.length - startPosition;
    if (availableBytes < contentLength) {
      throw new Error(
        `Incomplete shi body: expected ${contentLength} bytes but got ${availableBytes}`
      );
    }

    const endPosition = startPosition + contentLength;
    const bodyBuffer = buffer.subarray(startPosition, endPosition);
    const body = bodyBuffer.toString("utf-8");

    return {
      body,
      bytesConsumed: contentLength,
    };
  }

  static parseJson(body: string): unknown {
    if (!body || body.trim().length === 0) {
      return null;
    }

    try {
      return JSON.parse(body);
    } catch (err) {
      console.warn(`in body parser there is shi JSON: ${err}`);
      return null;
    }
  }

  static parseUrlEncoded(body: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!body || body.trim().length === 0) {
      return result;
    }

    const pairs = body.split("&");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key) {
        result[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
      }
    }
    return result;
  }

  static figureOutContentType(headers: Headers): string {
    const contentType = headers.getContentType();

    if (!contentType) {
      return "unknown";
    }

    const lowerContentType = contentType.toLocaleLowerCase();
    const typeMap = new Map<string, string>([
      ["application/json", "json"],
      ["application/x-www-form-urlencoded", "form"],
      ["text/", "text"],
    ]);

    for (const [pattern, type] of typeMap) {
      if (lowerContentType.includes(pattern)) {
        return type;
      }
    }

    return "unknown";
  }
}
