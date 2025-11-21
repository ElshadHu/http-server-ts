export class HeaderBuilder {
    private headers = new Map<string,string>();
    
    set(name: string, value: string): this {
        this.headers.set(name, value);
        return this;
    }

    get(name: string): string | undefined {
        return this.headers.get(name);
    }

    toString(): string {
        let result = "";
        for(const[name,value] of this.headers.entries()) {
            result += `${name}: ${value}\r\n`;
        }
        return result;
    }
}