import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { defaultAuthKey } from './config';
import { KEYPROTECTED_ERROR } from '../../shared/services/udp/constants';
import { Middleware } from '../middlewares';
import { Request, Response } from 'express';
import { ApiCallback, ClientInfo } from '../services/udp/types';
import { Content } from '../../shared/services/udp/types';

export function keyProtected(keyPath?: string) {
  return function (
    target: Middleware,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const exceptionRaiser = (msg: KEYPROTECTED_ERROR) => {
      return (): void => {
        throw new Error(msg);
      };
    };
    let keyContent: string;
    if (keyPath) {
      if (fs.existsSync(keyPath)) {
        const stats = fs.statSync(keyPath);

        if (stats.isDirectory()) {
          const keyFile = path.join(keyPath, 'key.txt');
          if (fs.existsSync(keyFile)) {
            keyContent = fs.readFileSync(keyFile, 'utf-8');
          } else {
            descriptor.value = exceptionRaiser(KEYPROTECTED_ERROR.KEYPROTECTED_MISSING_KEYFILE);
            return descriptor;
          }
        } else {
          keyContent = fs.readFileSync(keyPath, 'utf-8');
        }
      } else {
        descriptor.value = exceptionRaiser(KEYPROTECTED_ERROR.KEYPROTECTED_MISSING_KEYFILE);
        return descriptor;
      }
    } else {
      keyContent = defaultAuthKey.toString();
    }

    if (keyContent.length < 8) {
      descriptor.value = exceptionRaiser(KEYPROTECTED_ERROR.KEYPROTECTED_KEY_TOO_SHORT);
      return descriptor;
    }
    if (keyContent.length > 256) {
      descriptor.value = exceptionRaiser(KEYPROTECTED_ERROR.KEYPROTECTED_KEY_TOO_LONG);
      return descriptor;
    }

    const storedKeyHash = crypto.createHash('sha256').update(keyContent).digest('hex');

    keyContent = '';

    descriptor.value = async function (
      req: Request,
      res: Response,
      callback: ApiCallback
    ): Promise<Content | ClientInfo | ClientInfo[]> {
      const key = req.query.key?.toString() || undefined;
      if (!key) {
        throw new Error(KEYPROTECTED_ERROR.KEYPROTECTED_PASSWORD_REQUIRED);
      }
      const providedKeyHash = crypto.createHash('sha256').update(key).digest('hex');
      if (providedKeyHash != storedKeyHash) {
        throw new Error(KEYPROTECTED_ERROR.KEYPROTECTED_WRONG_PASSWORD);
      }
      return await originalMethod.apply(this, [req, res, callback]);
    };

    return descriptor;
  };
}
