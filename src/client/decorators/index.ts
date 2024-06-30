import { UDP_RESULT_ERROR } from "../../shared/services/udp/constants";
import { ParsedQs } from "qs";
import { Util, QueryArgsType } from "../util/utils";

export function applyToQuery(...signature: string[]) {
    return function (
      target: Util,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      descriptor.value =  async function (query:ParsedQs) {
        let args:QueryArgsType[] = [];
        let expectedArgNames:string[] = []

        for (const argNameDecorated of signature)
          {
            const argName = argNameDecorated.endsWith('?') ? argNameDecorated.slice(0, -1) : argNameDecorated;
            expectedArgNames.push(argName);
          }

        for (const argName of Object.keys(query))
        {
          if(!expectedArgNames.includes(argName) && argName != 'key')
            {
              throw new Error(UDP_RESULT_ERROR.WRONG_ARGUMENTS);
            }
        }


        for(const argNameDecorated of signature)
        {
            const argName = argNameDecorated.endsWith('?') ? argNameDecorated.slice(0, -1) : argNameDecorated;
            const arg = query[argName];
            if(!arg)
            {
               if(!argNameDecorated.endsWith('?'))
                {
                  throw new Error(UDP_RESULT_ERROR.WRONG_ARGUMENTS);
                }
            }
            args.push(arg);
        }
        return await originalMethod.apply(this, args);
      };
      return descriptor;
    };
  }