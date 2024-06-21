import { makeClient } from "./client/services/udp";
import { udpServer } from "./server/services/udp";

udpServer.listen()
const udpClient = makeClient(udpServer.port);
udpClient.clientId = `"NEW CLIENT ID OF ${udpServer.clients.length}"`

