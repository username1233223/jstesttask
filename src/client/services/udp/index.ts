import { UdpService } from '../../../shared/services/udp';
import { randomUUID } from 'crypto';
import {
  CHECK_INTERVAL,
  CLIENT_STATE,
  INACTIVITY_THRESHOLD,
  UDP_BROADCAST_ADDRESS,
  UDP_PROTOCOL_MESSAGES,
  UDP_RESULT_ERROR,
} from '../../../shared/services/udp/constants';
import { utilFunctions } from '../../util/utils';
import { Content } from '../../../shared/services/udp/types';

class UdpClientService extends UdpService {
  #serverPort: number;
  #clientId: string;
  #state: CLIENT_STATE;
  #lastHeartbeat: number;
  #capacities: string[];
  #checkConnectionInterval: NodeJS.Timeout;
  #pingServerInterval: NodeJS.Timeout;
  #lastConnectedServerAddress: string;
  #handleOk(content: Content): void {
    const address = content.address;
    const port = content.port;
    this.checkAddressPort(address, port);
    if (this.#state != CLIENT_STATE.CONNECTED) {
      console.log(`Server found on ${address}:${port}`);
    }
    this.#state = CLIENT_STATE.CONNECTED;
    this.#lastHeartbeat = Date.now();
    this.#lastConnectedServerAddress = address!;
  }
  #handleError(content: Content): void {
    const address = content.address;
    const port = content.port;
    this.checkAddressPort(address, port);
    console.log(`Got RESULT_ERROR from ${address}:${port}, error: ${content.error}`);
  }
  async #handleCallFunction(content: Content): Promise<void> {
    const address = content.address;
    const port = content.port;
    const functionName = content.functionName;
    this.checkAddressPort(address, port);

    if (!functionName || !this.#capacities.includes(functionName)) {
      this.send(address!, port!, {
        type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
        content: {
          messageId: content.messageId,
          clientId: this.#clientId,
          functionName: content.functionName,
          error: UDP_RESULT_ERROR.NO_SUCH_FUNCTION,
        },
      });
      return;
    }

    const func = utilFunctions[functionName];
    try {
      const result = await func(content.query);
      this.send(address!, port!, {
        type: UDP_PROTOCOL_MESSAGES.RESULT_OK,
        content: {
          messageId: content.messageId,
          clientId: this.#clientId,
          functionName: content.functionName,
          result: result,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.send(address!, port!, {
          type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
          content: {
            messageId: content.messageId,
            clientId: this.#clientId,
            functionName: content.functionName,
            error: `${error.message}`,
          },
        });
      } else {
        throw new Error(`Got an error which is not an instance of Error: ${error}`);
      }
    }
  }
  #checkConnection(): void {
    const now = Date.now();
    if (this.#lastHeartbeat != 0 && now - this.#lastHeartbeat > INACTIVITY_THRESHOLD) {
      if (this.#state == CLIENT_STATE.CONNECTED) {
        console.log(`Server no longer available on ${this.#lastConnectedServerAddress}`);
      }
      this.#state = CLIENT_STATE.DISCONNECTED;
    }
  }
  #pingServer(): void {
    switch (this.#state) {
      case CLIENT_STATE.INITIAL:
      case CLIENT_STATE.DISCONNECTED:
        this.hello();
        break;
      case CLIENT_STATE.CONNECTED:
        this.heartbeat();
        break;
      default:
        console.log(`Abnormal state: ${this.#state}`);
    }
  }
  constructor(port: number) {
    super(port + 1);
    this.#serverPort = port;
    this.#clientId = randomUUID();
    this.#capacities = ['randomNumber', 'hddSpeed', 'freeMemory'];
    this.#state = CLIENT_STATE.INITIAL;
    this.#lastHeartbeat = 0;
    this.#lastConnectedServerAddress = UDP_BROADCAST_ADDRESS;
    this.on(UDP_PROTOCOL_MESSAGES.RESULT_OK, this.#handleOk);
    this.on(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, this.#handleError);
    this.on(UDP_PROTOCOL_MESSAGES.CALL_FUNCTION, this.#handleCallFunction);

    this.#checkConnectionInterval = setInterval(() => this.#checkConnection(), CHECK_INTERVAL);
    this.#pingServerInterval = setInterval(() => this.#pingServer(), INACTIVITY_THRESHOLD);
  }

  set clientId(newId: string) {
    if (this.#clientId !== newId) {
      console.warn(`client Id has changed from ${this.#clientId} to ${newId}`);
      this.#clientId = newId;
    }
  }
  hello(): void {
    this.broadcast(this.#serverPort, {
      type: UDP_PROTOCOL_MESSAGES.HELLO,
      content: {
        clientId: this.#clientId,
        capacities: this.#capacities,
      },
    });
  }
  heartbeat(): void {
    this.send(this.#lastConnectedServerAddress, this.#serverPort, {
      type: UDP_PROTOCOL_MESSAGES.HEARTBEAT,
      content: {
        clientId: this.#clientId,
      },
    });
  }
}

export function makeClient(port: number): UdpClientService {
  return new UdpClientService(port);
}
