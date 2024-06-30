import { udpServer } from "../../services/udp";
import { ParsedQs } from "qs";
import { Content, Result } from "../../../shared/services/udp/types";
import { ClientInfo } from "../../services/udp/types";

export namespace ClientsController
{
    export function getUdpClients(): ClientInfo[] {
        return udpServer.clients;
    }
    export async function callClientFunction(clientId: string, functionName: string, query?: ParsedQs): Promise<Result> {
        const result = await udpServer.callFunction(functionName, clientId, query);
        return result;
    }
}