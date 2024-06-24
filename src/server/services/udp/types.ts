export interface ClientInfo {
    address: string;
    port: number;
    capacities: string[];
    lastHeartbeat: number;
    logo?: Buffer | string;
  }
  