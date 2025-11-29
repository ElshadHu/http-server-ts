export class Headers {
  private headers: Map<string, string>;
  constructor() {
    this.headers = new Map();
  }
  // Set Header

  set(name: string, value: string): void {
    this.headers.set(this.normalizeKey(name), value);
  }

  // Get Header

  get(name: string): string | undefined {
    return this.headers.get(this.normalizeKey(name));
  }
  // check if header exists
  has(name: string): boolean {
    return this.headers.has(this.normalizeKey(name));
  }
  // delete a header
  delete(name: string): void {
    this.headers.delete(this.normalizeKey(name));
  }
  // Get all headers as entries
  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }
  //Convert to plain Object
  toObject(): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [key, value] of this.headers.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  // normalize header name by making lowercase for case sensitive storage
  private normalizeKey(name: string): string {
    return name.toLocaleLowerCase();
  }

  toString(): string {
    let result = "";
    for (const [key, value] of this.headers.entries()) {
      result += `${key}: ${value}\r\n`;
    }
    return result;
  }

  setContentType(mimeType: string): void {
    this.set("Content-Type", mimeType);
  }

  setContentLength(length: number): void {
    this.set("Content-Length", length.toString());
  }

  getContentType(): string | undefined {
    return this.get("Content-Type");
  }

  getContentLength(): number | undefined {
    const value = this.get("Content-Length");
    return value ? parseInt(value, 10) : undefined;
  }
}
