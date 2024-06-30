import { udpServer } from '../../services/udp';
import { ParsedQs } from 'qs';
import { Result } from '../../../shared/services/udp/types';
import { ClientInfo } from '../../services/udp/types';

export class ClientsController {
  static getUdpClients(): ClientInfo[] {
    return udpServer.clients;
  }
  static async callClientFunction(
    clientId: string,
    functionName: string,
    query?: ParsedQs
  ): Promise<Result> {
    const result = await udpServer.callFunction(functionName, clientId, query);
    return result;
  }
}
