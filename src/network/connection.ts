import { Socket } from 'net';
import { IConnection, RemoteAddress, SocketState, DataCallback, CloseCallback, ErrorCallBack } from './types';

export class Connection implements IConnection {
    private socket: Socket;
    private state: SocketState = SocketState.CONNECTED;
    private dataCallback?: DataCallback;
    private closeCallback?: CloseCallback;
    private errorCallback?: ErrorCallBack;

    constructor(socket: Socket) {
        this.socket = socket;
        this.socket.on('data', (data) => this.dataCallback?.(data));
        this.socket.on('close', () => {
            this.state = SocketState.CLOSED;
            this.closeCallback?.();
        });
        this.socket.on('error', (err) => {
            this.state = SocketState.ERROR;
            this.errorCallback?.(err);
        });
    }
    
    write(data: Buffer | string): Promise<boolean> {
       return new Promise((resolve,reject) => {
          const flushed = this.socket.write(data, (err?: Error | null) => {
            if(err) {
                reject(err);
            } else {
                resolve(flushed);
            }
          });
       })
    }

    onData(callback: DataCallback): void {
        this.dataCallback = callback;
    }

    onClose(callback: CloseCallback): void {
        this.closeCallback = callback;
    }

    close(): void {
        this.socket.end();
        this.state = SocketState.CLOSING;
    }

    destroy(): void {
        this.socket.destroy();
        this.state = SocketState.CLOSED;
    }

    getRemoteAddress(): RemoteAddress {
        return {
            ip: this.socket.remoteAddress || 'unknown address',
            port: this.socket.remotePort || 0
        };
    }

    getState(): SocketState {
        return this.state;
    }

    getId(): string {
        return `${this.socket.remoteAddress}:${this.socket.remotePort}`;
    }
    onError(callback: ErrorCallBack): void {
        this.socket.on('error', (err:Error) => {
            callback(err);
        });
    }

    setTimeout(ms: number): void {
       this.socket.setTimeout(ms);
       this.socket.on('timeout', () => {
        this.socket.end();
       });
    }
}