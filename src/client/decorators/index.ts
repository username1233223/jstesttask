import { UDP_RESULT_ERROR } from "../../shared/services/udp/constants";

export function applyToQuery(...signature: string[]) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      descriptor.value =  async function (query:any) {
        let args:any = [];
        for(var argument of signature)
        {
            const arg = query[argument];
            if(!arg)
                {
                    throw Error(UDP_RESULT_ERROR.WRONG_ARGUMENTS);
                }
            args.push(arg);
        }
        return await originalMethod.apply(this, args);
      };
      return descriptor;
    };
  }