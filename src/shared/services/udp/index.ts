import dgram from 'dgram';
import {EventEmitter} from 'events';
import { UdpMessage } from './types';
import { DEFAULT_UDP_SERVER_PORT, SOCKET_EVENTS, UDP_BROADCAST_ADDRESS, UDP_PROTOCOL_MESSAGES, UDP_STATE } from './constants';

export class UdpService extends EventEmitter {
    readonly port: number;
    #socket: dgram.Socket;      
    constructor(port: number) {
      super();
      this.port = port;
      this.#socket = dgram.createSocket('udp4');

      this.#socket.on(SOCKET_EVENTS.LISTENING, () => {
        this.#socket.setBroadcast(true);
        const address = this.#socket.address();
        this.emit(UDP_STATE.UDP_STATE_READY, `UDP socket ready on ${address.address}:${address.port}`);
      });

      this.#socket.on(SOCKET_EVENTS.ERROR, (err) => {
        this.#socket.close();
        this.emit(UDP_STATE.UDP_STATE_ERROR, `Socket error: ${err.stack} ${err}`);
      });

      this.#socket.on(SOCKET_EVENTS.MESSAGE, (msg, rinfo) => {
        try {
            const message: UdpMessage = JSON.parse(msg.toString());
            message.content = {
              ...(message.content || {}),
              address: rinfo.address,
              port: rinfo.port
            };
            this.emit(message.type, message.content);
        } catch (error: unknown) {
          if(error instanceof Error)
            {
              this.emit(UDP_STATE.UDP_STATE_ERROR, `Socket error(parsing): ${error.message}`);
            }
            else{
              throw new Error(`Got an error which is not an instance of Error: ${error}`);
            }
        }
      }); 
      this.on(UDP_STATE.UDP_STATE_READY, this.handleSocketEvent);
      this.on(UDP_STATE.UDP_STATE_ERROR, this.handleSocketEvent);
    }
    protected handleSocketEvent = (data: string) => {console.log(data)};
    protected checkAddressPort(address?:string, port?:number): void{
      if(!address || !port)
        {
          this.emit(UDP_STATE.UDP_STATE_ERROR, `Missing address/port: ${address}:${port}`);
          return;
        }
    }
    start(): void {  
      this.#socket.bind(this.port);
    }
    send(address: string, port: number, message: UdpMessage): void {
      const msgString = JSON.stringify(message);
      this.#socket.send(msgString, port, address);
    }
    broadcast(port: number, message: UdpMessage): void {
      this.send(UDP_BROADCAST_ADDRESS, port, message);
    }
    
  }