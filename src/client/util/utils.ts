import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { UDP_RESULT_ERROR } from '../../shared/services/udp/constants';
import { Result } from '../../shared/services/udp/types';
import { ParsedQs } from 'qs';

type Query = ParsedQs | undefined;
type UtilArgsType = number | undefined;
type UtilFunction = (...args: UtilArgsType[]) => Promise<Result>;
type UtilWrapper = (rawQuery: Query) => Promise<Result>;
interface UtilParser {
  parseQuery(query: Query): UtilArgsType[];
}

class RandomNumberParser implements UtilParser {
  parseQuery(query: Query): number[] {
    const min = Number(query?.min) || 0;
    const max = Number(query?.max) || 100;
    return [min, max];
  }
}

export class Util {
  static applyToQuery(callback: UtilFunction, parserObject?: UtilParser): UtilWrapper {
    return async function (query: Query): Promise<Result> {
      const args = parserObject?.parseQuery(query) || [];
      return await callback(...args);
    };
  }

  static async randomNumber(min: number = 0, max: number = 100): Promise<Result> {
    if (min > max) {
      throw new Error(UDP_RESULT_ERROR.WRONG_ARGUMENTS);
    } else {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  static async hddSpeed(): Promise<Result> {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, 'hddspeed.tmp');
    const oneMB = 1024 * 1024;
    const data = Buffer.alloc(oneMB, '0');

    const start = Date.now();
    await fs.writeFile(tempFile, data);
    const end = Date.now();
    return end - start;
  }

  static async freeMemory(): Promise<Result> {
    return os.freemem();
  }
}

export const utilFunctions: Record<string, UtilWrapper> = {
  randomNumber: Util.applyToQuery(Util.randomNumber, new RandomNumberParser()),
  hddSpeed: Util.applyToQuery(Util.hddSpeed),
  freeMemory: Util.applyToQuery(Util.freeMemory),
};
