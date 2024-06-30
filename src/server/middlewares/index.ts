import { Request, Response, NextFunction } from 'express';
import { keyProtected } from '../decorators';
import { KEYPROTECTED_ERROR } from '../../shared/services/udp/constants';
import { ApiCallback } from '../services/udp/types';

export class  Middleware{
  @keyProtected()
  static async protectedWrapper(req: Request, res: Response, callback: ApiCallback) {
        return await callback(req, res);
      };
  static withApiResponse(callback: ApiCallback) {
      return async (req: Request, res: Response, next: NextFunction) =>{
        try{
          const result = await Middleware.protectedWrapper(req, res, callback);
          res.status(200).json(result);
          next();
        }catch(error: unknown)
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
        res.status(500).send({
          error: err.message
        });
      }
}
