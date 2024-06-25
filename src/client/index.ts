import { DEFAULT_UDP_SERVER_PORT } from "../shared/services/udp/constants";
import { makeClient } from "./services/udp";

const udpClient = makeClient(DEFAULT_UDP_SERVER_PORT);
udpClient.start();
udpClient.hello();