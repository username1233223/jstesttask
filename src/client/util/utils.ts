import os from 'os';
import path from 'path';
import fs from "fs/promises";
import { UDP_RESULT_ERROR } from '../../shared/services/udp/constants';

export namespace Util
{
    function randomNumber(min: number = 0, max: number = 100): number {
        if (min > max) {
          throw new Error(UDP_RESULT_ERROR.WRONG_ARGUMENTS);
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    async function hddSpeed(): Promise<number> {
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, 'speedtest.tmp');
        const oneMB = 1024*1024*1024;
        const data = Buffer.alloc(oneMB, '0');

        const start = Date.now();
        await fs.writeFile(tempFile, data);
        const end = Date.now();
        return end - start;
        }
    function freeMemory(): number {
        return os.freemem();
        }
  
    export const utilFunctions: Record<string, Function> = {
      'randomNumber': randomNumber,
      'hddSpeed': hddSpeed,
      'freeMemory': freeMemory
    }
}

