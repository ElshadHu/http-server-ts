import net from 'net';
import { SocketState, Address, ListenerConfig, ConnectionCallBack, IListener } from './types';
import { Connection } from './connection';
class Listener implements IListener {
    private server: net.Server;
    private state: SocketState;
    private address: Address = {host:'', port:0};

    constructor(private config: ListenerConfig) {
        this.address = {host: config.host, port: config.port};
        this.server = net.createServer();
        this.state = SocketState.CREATED;
    }
    bind(port: number, host: string): void {
        this.address = {port, host};
        this.state = SocketState.BOUND;
    }

    listen(backlog?: number): void {
       this.server.listen(this.address.port, this.address.host, backlog, () => {
        this.state = SocketState.LISTENING;
        console.log(`listening on ${this.address.host}:${this.address.port}`);
       });  
    }

    onConnection(callback: ConnectionCallBack): void {
        this.server.on('connection', (socket) => {
            const connecting = new Connection(socket);
            callback(connecting);
        })
    }
    
    close(): void {
        this.server.removeAllListeners();
        this.state = SocketState.CLOSED;
    }

    getState(): SocketState {
        return this.state;
    }

    getAddress(): Address {
        return this.address;
    }

}