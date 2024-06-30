import { Request, Response, NextFunction } from 'express';
import { keyProtected } from '../decorators';
import { KEYPROTECTED_ERROR } from '../../shared/services/udp/constants';

export class  Middleware{
  @keyProtected()
  static async protectedWrapper(req: Request, res: Response, callback: Function) {
        return await callback(req, res);
      };
  static withApiResponse(callback: any) {
      return async (req: Request, res: Response, next: NextFunction) =>{
        try{
          if (!callback){
            throw Error(KEYPROTECTED_ERROR.KEYPROTECTED_NO_CALLBACK);
          }
          const result = await Middleware.protectedWrapper(req, res, callback);
          res.status(200).json(result);
          next();
        }catch (error)
        {
          next(error);
        }
        ;
      }
    }
  
    
    static errorHandlerMiddleware(
        err: Error,
        req: Request,
        res: Response,
        next: NextFunction
      ) {
        res.status(500).send(err.message);
      }
}
