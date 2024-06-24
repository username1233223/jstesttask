import { UdpService } from "../../../shared/services/udp";
import { randomUUID } from 'crypto';
import { CHECK_INTERVAL, CLIENT_STATE, DEFAULT_UDP_SERVER_PORT, INACTIVITY_THRESHOLD, UDP_BROADCAST_ADDRESS, UDP_PROTOCOL_MESSAGES } from "../../../shared/services/udp/constants";

class UdpClientService extends UdpService {
    #serverPort: number;
    #clientId: string;
    #state: CLIENT_STATE;
    #lastHeartbeat: number;
    #checkConnectionInterval: NodeJS.Timeout;
    #pingServerInterval: NodeJS.Timeout;
    #lastConnectedServerAddress: string;
    #handleOk(content: any){
        this.#state = CLIENT_STATE.CONNECTED;
        this.#lastHeartbeat = Date.now();
        this.#lastConnectedServerAddress = content.address;
        console.log(`Server found on ${content.address}:${content.port}`);
        };
    #handleError(content: any){
        console.log(`Got RESULT_ERROR from ${content.address}:${content.port}, error: ${content}`);
        };
    #checkConnection() {
        const now = Date.now();
        if (this.#lastHeartbeat != 0 && (now - this.#lastHeartbeat) > INACTIVITY_THRESHOLD) {
            this.#state = CLIENT_STATE.DISCONNECTED;
            console.log(`server no longer available on ${this.#lastConnectedServerAddress}`);
        };
        }
    #pingServer(){
        switch(this.#state)
        {
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
        super(port+1);
        this.#serverPort = port;
        this.#clientId = randomUUID();
        this.#state = CLIENT_STATE.INITIAL;
        this.#lastHeartbeat = 0;
        this.#lastConnectedServerAddress = UDP_BROADCAST_ADDRESS;
        this.on(UDP_PROTOCOL_MESSAGES.RESULT_OK, this.#handleOk);
        this.on(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, this.#handleError);
        this.#checkConnectionInterval = setInterval(() => this.#checkConnection(), CHECK_INTERVAL);
        this.#pingServerInterval = setInterval(() => this.#pingServer(), INACTIVITY_THRESHOLD);

    }

    set clientId(newId: string) {
        if (this.#clientId !== newId) {
            console.warn(`client Id has changed from ${this.#clientId} to ${newId}`);
            this.#clientId = newId;
        }
    }
    hello()
    {
        this.broadcast(this.#serverPort, {type:UDP_PROTOCOL_MESSAGES.HELLO, content:{
            clientId: this.#clientId,
            capacities: ["capacities1", "capacities2"]
        }});
    }
    heartbeat()
    {
        this.send(this.#lastConnectedServerAddress, this.#serverPort, {type: UDP_PROTOCOL_MESSAGES.HEARTBEAT, content:{
            clientId:this.#clientId
        }
        });
    }
}

export function makeClient(port: number): UdpClientService {
    return new UdpClientService(port);
}
