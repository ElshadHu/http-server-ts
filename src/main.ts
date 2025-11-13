import { Listener } from './network/listener';
import { IConnection, RemoteAddress } from "./network/types";

const listener = new Listener({ host:'127.0.0.1', port:8080 });

listener.onConnection((conn: IConnection) => {
    const remote: RemoteAddress = conn.getRemoteAddress();
    console.log('Client connected:', remote.ip, remote.port);

    conn.onData((data:Buffer | string) => {
        console.log('Got data:', data);
        conn.write(`Echo: ${data}`);
    });

    conn.onClose(() => {
        console.log('Client disconnected:', conn.getId());
    });
    
    conn.onError((err) => {
        console.log('Connection error:', err);
    });

});
   listener.bind(8080, '127.0.0.1');

    listener.listen();