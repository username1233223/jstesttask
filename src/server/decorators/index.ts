import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { defaultAuthKey } from './config';
import { KEYPROTECTED_ERROR } from '../../shared/services/udp/constants';

export function keyProtected(keyPath?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const exceptionRaiser = (msg: KEYPROTECTED_ERROR) => {
        return () => {throw new Error(msg)};
    };
    let storedKeyHash: string;

      let keyContent: string;
      if (keyPath)
        {
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
        }
        else{
            keyContent = defaultAuthKey.toString();
        }


      if (keyContent.length < 8) {
        descriptor.value = exceptionRaiser(KEYPROTECTED_ERROR.KEYPROTECTED_KEY_TOO_SHORT);
        return descriptor;
      }
      if (keyContent.length > 256) {
        descriptor.value =  exceptionRaiser(KEYPROTECTED_ERROR.KEYPROTECTED_KEY_TOO_LONG);
        return descriptor;
      }

      storedKeyHash = crypto.createHash('sha256').update(keyContent).digest('hex');
      
      keyContent = '';


    descriptor.value =  async function (...args: any[]) {

        const key = args?.[0].query?.key || undefined;
        if(!key)
        {
            throw new Error(KEYPROTECTED_ERROR.KEYPROTECTED_PASSWORD_REQUIRED);
        }
        const providedKeyHash = crypto.createHash('sha256').update(key).digest('hex');
        if (providedKeyHash != storedKeyHash) {
            throw new Error(KEYPROTECTED_ERROR.KEYPROTECTED_WRONG_PASSWORD);
          }

      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
