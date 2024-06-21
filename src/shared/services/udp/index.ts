import dgram from 'dgram';
export class UdpService {
    readonly port: number;
    #socket = dgram.createSocket('udp4');
    constructor(port: number) {
      this.port = port;
    }
    listen(): void {  
      this.#socket.on('error', (err) => {
        console.log(`Error: ${err.stack} ${err}`);
        this.#socket.close();
      });
  
      this.#socket.on('message', (msg, rinfo) => {
        console.log(`Received message from ${rinfo.address}:${rinfo.port}: ${msg}`);
      });
  
      this.#socket.on('listening', () => {
        const address = this.#socket.address();
        console.log(`UDP server listening on ${address.address}:${address.port}`);
      });
  
      this.#socket.bind(this.port);
    }
    send(address: string, port: number, message: any): void {
      const msgString = JSON.stringify(message);
      this.#socket.send(msgString, port, address);
    }
    broadcast(port: number, message: any): void {
      this.send('255.255.255.255', port, message);
    }
  }