import { Content } from '../../../shared/services/udp/types';
import { Request, Response } from 'express';

export interface ClientInfo {
  address?: string;
  port?: number;
  capacities: string[];
  lastHeartbeat?: number;
  logo?: Buffer | string;
  clientId?: string;
}

export type ApiCallback = (
  req: Request,
  res: Response
) => Promise<Content | ClientInfo | ClientInfo[]>;
