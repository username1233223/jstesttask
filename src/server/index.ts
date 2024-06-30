import { DEFAULT_EXPRESS_PORT } from '../shared/services/udp/constants';
import { startRouter } from './routes';
import { udpServer } from './services/udp';

udpServer.start();
startRouter(DEFAULT_EXPRESS_PORT);
