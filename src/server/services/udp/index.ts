import { UdpService } from '../../../shared/services/udp';
import { ClientInfo, ClientSummary } from './types';

class UdpServerService extends UdpService {
    #clients: Map<string, ClientInfo> = new Map();
  
    get clients(): ClientSummary[] {
        const clientData = [] as ClientSummary[];
        return Array.from(this.#clients).map(([id, data])=>({
                clientId: id,
                capacities: data.capacities,
                address: `${data.address}:${data.port}`
              })
            );
        }
  }

  export const udpServer = new UdpServerService(22001);