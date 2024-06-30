import { udpServer } from "../../services/udp";

export namespace ClientsController
{
    export function getUdpClients(): any[] {
        return udpServer.clients;
    }
    export async function callClientFunction(clientId: string, functionName: string, query?: any): Promise<any> {
        const result = await udpServer.callFunction(functionName, clientId, query);
        return result;
    }
}