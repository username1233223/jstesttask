import { ParsedQs } from 'qs';

export type Result = string | undefined;
export interface Content {
  messageId?: string;
  address?: string;
  port?: number;
  clientId?: string;
  capacities?: string[];
  logo?: string | Buffer;
  error?: string;
  functionName?: string;
  query?: ParsedQs;
  result?: Result;
}

export interface UdpMessage {
  type: string;
  content?: Content;
}
