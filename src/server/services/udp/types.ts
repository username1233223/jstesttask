export interface ClientInfo {
    address: string;
    port: number;
    capacities: string[];
    logo?: Buffer | string;
  }
  
  export interface ClientSummary {
    clientId: string;
    capacities: string[];
    address: string
  }