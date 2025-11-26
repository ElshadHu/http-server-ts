export interface KeepAliveConfig {
    enabled: boolean;
    timeoutMs: number;
    maxRequests: number;
}

export class KeepAliveManager {
    private requestCount = 0;
    private lastActivityTime: number;
    private readonly config: KeepAliveConfig;

    constructor(config: Partial<KeepAliveConfig> = {}) {
        this.config = {
            enabled: config.enabled ?? true,
            timeoutMs: config.timeoutMs ?? 60000, // 60 seconds default
            maxRequests: config.maxRequests ?? 100
        };
        this.lastActivityTime = Date.now();
    }

    incrementRequests(): void {
        this.requestCount++;
        this.lastActivityTime = Date.now();
    }

    shouldKeepAlive(): boolean {
        if(!this.config.enabled) {
            return false;
        }

        if(this.requestCount >= this.config.maxRequests) {
            return false;
        }

        const timeSinceActivity = Date.now() - this.lastActivityTime;
        if(timeSinceActivity > this.config.timeoutMs) {
            return false;
        }

        return true;
    }

    getConnectionHeader(): string {
        return this.shouldKeepAlive() ? 'keep-alive' : 'close';
    }

    getKeepAliveHeader(): string {
        const remainingRequests = this.config.maxRequests - this.requestCount;
        const timeoutSeconds = Math.floor(this.config.timeoutMs / 1000);
        return `timeout=${timeoutSeconds}, max=${remainingRequests}`;
    }

    getStats() {
        return {
            requestCount: this.requestCount,
            maxRequests: this.config.maxRequests,
            remainingRequests: this.config.maxRequests - this.requestCount,
            timeSinceActivity: Date.now() - this.lastActivityTime,
            timeoutMs: this.config.timeoutMs,
            shouldKeepAlive: this.shouldKeepAlive()
        };
    }

    reset(): void {
        this.requestCount = 0;
        this.lastActivityTime = Date.now();
    }
}