import { UdpService } from "../../../shared/services/udp";
import { randomUUID } from 'crypto';
import { CHECK_INTERVAL, CLIENT_STATE, DEFAULT_UDP_SERVER_PORT, INACTIVITY_THRESHOLD, UDP_BROADCAST_ADDRESS, UDP_PROTOCOL_MESSAGES, UDP_RESULT_ERROR } from "../../../shared/services/udp/constants";
import {Util} from "../../util/utils"
class UdpClientService extends UdpService {
    #serverPort: number;
    #clientId: string;
    #state: CLIENT_STATE;
    #lastHeartbeat: number;
    #capacities: string[];
    #checkConnectionInterval: NodeJS.Timeout;
    #pingServerInterval: NodeJS.Timeout;
    #lastConnectedServerAddress: string;
    #handleOk(content: any){
        if (this.#state != CLIENT_STATE.CONNECTED)
        {
            console.log(`Server found on ${content.address}:${content.port}`);
        }
        this.#state = CLIENT_STATE.CONNECTED;
        this.#lastHeartbeat = Date.now();
        this.#lastConnectedServerAddress = content.address;
        };
    #handleError(content: any){
            console.log(`Got RESULT_ERROR from ${content.address}:${content.port}, error: ${content.error}`);
        };
    async #handleCallFunction(content: any){
        if (!this.#capacities.includes(content.functionName))
        {
            this.send(content.address, content.port, {type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR, content: {
                messageId: content.messageId,
                clientId: this.#clientId,
                functionName: content.functionName,
                error: UDP_RESULT_ERROR.NO_SUCH_FUNCTION
            }});
            return;
        }
        const func = Util.utilFunctions[content.functionName];
        try{
            const result = await func(...(content.args ?? []));
            this.send(content.address, content.port, {type: UDP_PROTOCOL_MESSAGES.RESULT_OK, content: {
                messageId: content.messageId,
                clientId: this.#clientId,
                functionName: content.functionName,
                result: result
            }});
        }
        catch(error)
        {
            this.send(content.address, content.port, {type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR, content: {
                messageId: content.messageId,
                clientId: this.#clientId,
                functionName: content.functionName,
                error: `${error}`
            }});
        }
        };
    #checkConnection() {
        const now = Date.now();
        if (this.#lastHeartbeat != 0 && (now - this.#lastHeartbeat) > INACTIVITY_THRESHOLD) {
            if (this.#state == CLIENT_STATE.CONNECTED)
            {
                console.log(`Server no longer available on ${this.#lastConnectedServerAddress}`);
            }
            this.#state = CLIENT_STATE.DISCONNECTED;
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
        this.#capacities = ["randomNumber", "hddSpeed", "freeMemory"];
        this.#state = CLIENT_STATE.INITIAL;
        this.#lastHeartbeat = 0;
        this.#lastConnectedServerAddress = UDP_BROADCAST_ADDRESS;
        this.on(UDP_PROTOCOL_MESSAGES.RESULT_OK, this.#handleOk);
        this.on(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, this.#handleError);
        this.on(UDP_PROTOCOL_MESSAGES.CALL_FUNCTION, this.#handleCallFunction)

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
            capacities: this.#capacities
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
