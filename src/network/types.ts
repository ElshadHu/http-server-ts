export enum SocketState {
    CREATED,
    BOUND,
    LISTENING,
    CONNECTED,
    CLOSING,
    CLOSED,
    ERROR
}


export type Address = {
    host: string;  // localhost 
    port: number; //8080
}

export type RemoteAddress = {
    ip: string; // client's IP
    port: number; // client's port
}

// Config types

export type ListenerConfig = {
    port: number;
    host: string;
    backlog?: number; // max pending connections
    connectionTimeoutMs?: number;
}

// Info Types

export type ConnectionInfo = {
    id: string;
    remoteAddress: RemoteAddress;
    connectedAt: Date;
    state: SocketState;
}

// Callback types

export type ConnectionCallBack = (connection: IConnection) => void | Promise<void>;
export type DataCallback = (data: Buffer | string) => void;
export type CloseCallback = () => void;
export type ErrorCallBack = (error: Error) => void;


export interface IListener {
    bind(port: number, host: string): void;
    listen(backlog?: number): void;
    onConnection(callback: ConnectionCallBack): void;
    close():void;
    destroy():void;
    getState(): SocketState;
    getAddress(): Address;
}

export interface IConnection {
    write(data: Buffer | string): Promise<boolean>;
    onData(callback: DataCallback): void;
    onClose(callback: CloseCallback): void;
    onError(callback:ErrorCallBack): void;
    close(): void;
    destroy(): void;
    getRemoteAddress(): RemoteAddress;
    getState(): SocketState;
    getId(): string;
    setTimeout(ms: number):void;
    isAlive(): boolean;
}