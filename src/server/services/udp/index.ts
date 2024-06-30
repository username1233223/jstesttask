import { resolve } from 'path';
import { UdpService } from '../../../shared/services/udp';
import { CHECK_INTERVAL, DEFAULT_UDP_SERVER_PORT, INACTIVITY_THRESHOLD, UDP_BROADCAST_ADDRESS, UDP_PROTOCOL_MESSAGES, UDP_RESULT_ERROR } from '../../../shared/services/udp/constants';
import { ClientInfo } from './types';
import { time } from 'console';
import { randomUUID } from 'crypto';

class UdpServerService extends UdpService {
    #clients: Map<string, ClientInfo>;
    #cleanupInterval: NodeJS.Timeout;
    async #handleHello(content: any){
      this.#clients.set(content.clientId, {
        address: content.address,
        port: content.port,
        capacities: content.capacities,
        lastHeartbeat: Date.now(),
        logo: content.logo
      });
      console.log(`Client with id ${content.clientId} is connected from ${content.address} and provides ${content.capacities.join(', ')}`);
      this.send(content.address, content.port, {type: UDP_PROTOCOL_MESSAGES.RESULT_OK});
      }
    #handleHeartbeat(content: any) {
        const client = this.#clients.get(content.clientId);
        
        if (client) {
          client.lastHeartbeat = Date.now();
          this.send(content.address, content.port, { type: UDP_PROTOCOL_MESSAGES.RESULT_OK });
        } else {
          this.send(content.address, content.port, {
            type: UDP_PROTOCOL_MESSAGES.RESULT_ERROR,
            content: {
              error: UDP_RESULT_ERROR.RECONNECT_NEED
            }
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
    async callFunction(functionName: string, clientId: string, args?:string[]): Promise<any>{
      const clientInfo = this.#clients.get(clientId);
      if (!clientInfo)
        {
          this.emit(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, {error: UDP_RESULT_ERROR.NO_SUCH_CLIENT});
          return;
        }
      else{
        const capacities = clientInfo.capacities;
        if (!capacities.includes(functionName))
          {
            this.emit(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, {error: UDP_RESULT_ERROR.NO_SUCH_FUNCTION});
            return;
          }
        const promiseSend = new Promise<any>((resolve, reject) => {
          const messageId = randomUUID();
          const timeout = setTimeout(() => {
            reject({
              messageId: messageId,
              functionName: functionName,
              clientId: clientId,
              error: UDP_RESULT_ERROR.CALL_FUNCTION_TIMEOUT
            });
          }, INACTIVITY_THRESHOLD);
          const okHandler = (content: any) => {
            if (messageId == content.messageId){
              clearTimeout(timeout);
              resolve(content)
            }
            else{
              this.once(UDP_PROTOCOL_MESSAGES.RESULT_OK, okHandler);
            }
          };
          const errorHandler = (content: any) => {
            if (messageId == content.messageId){
              clearTimeout(timeout);
              reject(content);
            }
            else{
              this.once(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, errorHandler);
            }
          };

          this.once(UDP_PROTOCOL_MESSAGES.RESULT_OK, okHandler);
          this.once(UDP_PROTOCOL_MESSAGES.RESULT_ERROR, errorHandler);
          this.send(clientInfo.address, clientInfo.port, {
            type: UDP_PROTOCOL_MESSAGES.CALL_FUNCTION,
            content: {
             messageId: messageId,
             functionName: functionName,
             args: args
            } 
           });
        });
        return await promiseSend.then((content)=>{

          console.log(`Remote function ${content.functionName} on ${content.clientId} returned ${content.result}`);
          return content.result;
        }).catch((content)=>{
          console.log(`Remote function ${content.functionName} on ${content.clientId} returned an error ${content.error}`);
          if(content.error == UDP_RESULT_ERROR.CALL_FUNCTION_TIMEOUT){
            this.#clients.delete(clientId);
            console.log(`Client with id ${clientId} is no longer available`);
          }
          throw Error(content.error);
        })
      }
    }
  }

  
  export const udpServer = new UdpServerService(DEFAULT_UDP_SERVER_PORT);
