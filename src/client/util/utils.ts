import os from 'os';
import path from 'path';
import fs from "fs/promises";
import { UDP_RESULT_ERROR } from '../../shared/services/udp/constants';
import { applyToQuery } from '../decorators';

export class Util
{
    @applyToQuery('min', 'max')
    static randomNumber(min: number = 0, max: number = 100): number {
      const numberMin = Number(min);
      const numberMax = Number(max);
        if (numberMin > numberMax) {
          throw new Error(UDP_RESULT_ERROR.WRONG_ARGUMENTS);
        }
        else{
          return Math.floor(Math.random() * (numberMax - numberMin + 1)) + numberMin;
        }
      }
    
    @applyToQuery()
    static async hddSpeed(): Promise<number> {
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, 'speedtest.tmp');
        const oneMB = 1024*1024;
        const data = Buffer.alloc(oneMB, '0');

        const start = Date.now();
        await fs.writeFile(tempFile, data);
        const end = Date.now();
        return end - start;
        }
      
    @applyToQuery()
    static freeMemory(): number {
        return os.freemem();
        }
}
 
export const utilFunctions: Record<string, Function> = {
  'randomNumber': Util.randomNumber,
  'hddSpeed': Util.hddSpeed,
  'freeMemory': Util.freeMemory
};
