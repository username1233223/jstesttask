import { UdpService } from '../../../shared/services/udp';
import {
  CHECK_INTERVAL,
  DEFAULT_UDP_SERVER_PORT,
  INACTIVITY_THRESHOLD,
  UDP_PROTOCOL_MESSAGES,
  UDP_RESULT_ERROR,
} from '../../../shared/services/udp/constants';
import { ClientInfo } from './types';
import { randomUUID } from 'crypto';
import { Content, Result } from '../../../shared/services/udp/types';
import { ParsedQs } from 'qs';

class UdpServerService extends UdpService {
  #clients: Map<string, ClientInfo>;
  #cleanupInterval: NodeJS.Timeout;
  async #handleHello(content: Content): Promise<void> {
    const clientId = content.clientId;
    const capacities = content.capacities || [];
    const address = content.address;
    const port = content.port;

    this.checkAddressPort(address, port);
    if (!clientId) {
      this.send(address!, port!, {
        type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
        content: {
          error: UDP_RESULT_ERROR.MISSING_CLIENT_ID,
        },
      });
      return;
    }

    this.#clients.set(clientId, {
      address: address!,
      port: port!,
      capacities: capacities,
      lastHeartbeat: Date.now(),
      logo: content.logo,
    });
    console.log(
      `Client with id ${clientId} is connected from ${address} and provides ${capacities.join(', ')}`
    );
    this.send(address!, port!, { type: UDP_PROTOCOL_MESSAGES.RESULT_OK });
  }

  #handleHeartbeat(content: Content): void {
    const clientId = content.clientId;
    const address = content.address;
    const port = content.port;
    this.checkAddressPort(address, port);
    if (!clientId) {
      this.send(address!, port!, {
        type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
        content: {
          error: UDP_RESULT_ERROR.MISSING_CLIENT_ID,
        },
      });
      return;
    }

    const client = this.#clients.get(clientId);

    if (client) {
      client.lastHeartbeat = Date.now();
      this.send(address!, port!, { type: UDP_PROTOCOL_MESSAGES.RESULT_OK });
    } else {
      this.send(address!, port!, {
        type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
        content: {
          error: UDP_RESULT_ERROR.RECONNECT_NEED,
        },
      });
    }
  }

  #cleanupInactiveClients(): void {
    const now = Date.now();

    this.#clients.forEach((client, clientId) => {
      if (now - client.lastHeartbeat! > INACTIVITY_THRESHOLD) {
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
    this.#clients = new Map();
  }

  get clients(): ClientInfo[] {
    return Array.from(this.#clients).map(([id, data]) => ({
      clientId: id,
      capacities: data.capacities,
      address: `${data.address}:${data.port}`,
      logo: data.logo,
    }));
  }
  async callFunction(functionName: string, clientId: string, query?: ParsedQs): Promise<Result> {
    const clientInfo = this.#clients.get(clientId);
    if (!clientInfo) {
      throw new Error(UDP_RESULT_ERROR.NO_SUCH_CLIENT);
    } else {
      const capacities = clientInfo.capacities;
      if (!capacities.includes(functionName)) {
        throw new Error(UDP_RESULT_ERROR.NO_SUCH_FUNCTION);
      }

      const promiseSend = new Promise<Content>((resolve, reject) => {
        const messageId = randomUUID();
        const timeout = setTimeout(() => {
          reject({
            messageId: messageId,
            functionName: functionName,
            clientId: clientId,
            error: UDP_RESULT_ERROR.CALL_FUNCTION_TIMEOUT,
          });
        }, INACTIVITY_THRESHOLD);

        const okHandler = (content: Content): void => {
          if (messageId == content.messageId) {
            this.off(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, errorHandler);
            clearTimeout(timeout);
            resolve(content);
          } else {
            this.once(UDP_PROTOCOL_MESSAGES.RESULT_OK, okHandler);
          }
        };
        const errorHandler = (content: Content): void => {
          if (messageId == content.messageId) {
            this.off(UDP_PROTOCOL_MESSAGES.RESULT_OK, okHandler);
            clearTimeout(timeout);
            reject(content);
          } else {
            this.once(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, errorHandler);
          }
        };

        this.once(UDP_PROTOCOL_MESSAGES.RESULT_OK, okHandler);
        this.once(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, errorHandler);
        this.send(clientInfo.address!, clientInfo.port!, {
          type: UDP_PROTOCOL_MESSAGES.CALL_FUNCTION,
          content: {
            messageId: messageId,
            functionName: functionName,
            query: query,
          },
        });
      });
      return await promiseSend
        .then((content) => {
          console.log(
            `Remote function ${content.functionName} on ${content.clientId} returned ${content.result}`
          );
          return content.result;
        })
        .catch((content) => {
          console.log(
            `Remote function ${content.functionName} on ${content.clientId} returned an error ${content.error}`
          );
          if (content.error == UDP_RESULT_ERROR.CALL_FUNCTION_TIMEOUT) {
            this.#clients.delete(clientId);
            console.log(`Client with id ${clientId} is no longer available`);
          }
          throw new Error(content.error);
        });
    }
  }
}

export const udpServer = new UdpServerService(DEFAULT_UDP_SERVER_PORT);
