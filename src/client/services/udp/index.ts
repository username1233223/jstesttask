import { UdpService } from "../../../shared/services/udp";
import { randomUUID } from 'crypto';

enum ClientState {
    INITIAL = 'INITIAL',
    CONNECTED = 'CONNECTED',
    DISCONNECTED = 'DISCONNECTED'
}

class UdpClientService extends UdpService {
    #serverPort: number;
    #clientId: string;
    #state: ClientState;

    constructor(port: number) {
        super(port);
        this.#serverPort = port + 1;
        this.#clientId = randomUUID();
        this.#state = ClientState.INITIAL;
    }

    set clientId(newId: string) {
        if (this.#clientId !== newId) {
            console.warn(`client Id has changed from ${this.#clientId} to ${newId}`);
            this.#clientId = newId;
        }
    }
}

export function makeClient(port: number): UdpClientService {
    return new UdpClientService(port);
}