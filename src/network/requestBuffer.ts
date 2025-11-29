export class RequestBuffer {
  private chunks: Buffer[] = [];
  private totalSize = 0;
  private readonly MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

  append(chunk: Buffer): void {
    if (this.totalSize + chunk.length > this.MAX_SIZE) {
      throw new Error("Request is too large");
    }
    this.chunks.push(chunk);
    this.totalSize += chunk.length;
  }

  hasCompleteHeaders(): boolean {
    const marker = Buffer.from(`\r\n\r\n`);

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]!;
      const index = chunk.indexOf(marker);

      if (index !== -1) {
        return true;
      }

      if (i < this.chunks.length - 1) {
        const combined = Buffer.concat([chunk.subarray(-3), this.chunks[i + 1]!.subarray(0, 3)]);
        if (combined.indexOf(marker) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  // Full buffer only needed

  toBuffer(): Buffer {
    if (this.chunks.length === 0) {
      return Buffer.alloc(0);
    }
    if (this.chunks.length === 1) {
      return this.chunks[0]!;
    }
    return Buffer.concat(this.chunks);
  }

  reset(): void {
    this.chunks = [];
    this.totalSize = 0;
  }

  getSize(): number {
    return this.totalSize;
  }

  isLarger(): boolean {
    return this.totalSize > this.MAX_SIZE;
  }

  getStats() {
    return {
      chunks: this.chunks.length,
      totalBytes: this.totalSize,
      avgChunkSize: this.chunks.length > 0 ? Math.round(this.totalSize / this.chunks.length) : 0,
      maxSize: this.MAX_SIZE,
    };
  }
}
