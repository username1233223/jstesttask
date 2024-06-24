import { UdpService } from '../../../shared/services/udp';
import { CHECK_INTERVAL, DEFAULT_UDP_SERVER_PORT, INACTIVITY_THRESHOLD, UDP_BROADCAST_ADDRESS, UDP_PROTOCOL_MESSAGES } from '../../../shared/services/udp/constants';
import { ClientInfo } from './types';

class UdpServerService extends UdpService {
    #clients: Map<string, ClientInfo>;
    #cleanupInterval: NodeJS.Timeout;
    #handleHello(content: any){
      this.#clients.set(content.clientId, {
        address: content.address,
        port: content.port,
        capacities: content.capacities,
        lastHeartbeat: Date.now(),
        logo: content.logo
      });
      console.log(`Client with id ${content.clientId} is connected from ${content.address} and provides ${content.capacities.join(', ')}`);
      this.send(content.address, content.port, {type: UDP_PROTOCOL_MESSAGES.RESULT_OK});
      };
    #handleHeartbeat(content: any) {
        const client = this.#clients.get(content.clientId);
        
        if (client) {
          client.lastHeartbeat = Date.now();
          this.send(content.address, content.port, { type: UDP_PROTOCOL_MESSAGES.RESULT_OK });
        } else {
          this.send(content.address, content.port, {
            type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
            content: "reconnect_needed"
          });
        }
      }
    #cleanupInactiveClients() {
      const now = Date.now();
  
      this.#clients.forEach((client, clientId) => {
        if (now - client.lastHeartbeat > INACTIVITY_THRESHOLD) {
          this.#clients.delete(clientId);
          console.log(`Client with id ${clientId} is no longer available`);
        }
      });
    }
    constructor(port: number) {
      super(port);
      this.on(UDP_PROTOCOL_MESSAGES.HELLO, this.#handleHello);
      this.on(UDP_PROTOCOL_MESSAGES.HEARTBEAT, this.#handleHeartbeat);

      this.#cleanupInterval = setInterval(() => this.#cleanupInactiveClients(), CHECK_INTERVAL);
      this.#clients= new Map();

  }

    get clients(): any[] {
        return Array.from(this.#clients).map(([id, data])=>({
                clientId: id,
                capacities: data.capacities,
                address: `${data.address}:${data.port}`
              })
            );
        }

  }

  
  export const udpServer = new UdpServerService(DEFAULT_UDP_SERVER_PORT);
