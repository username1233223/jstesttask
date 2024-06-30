import { Request, Response, NextFunction } from 'express';
import { keyProtected } from '../decorators';
import { ApiCallback, ClientInfo } from '../services/udp/types';
import { Content } from '../../shared/services/udp/types';

export class Middleware {
  @keyProtected()
  static async protectedWrapper(
    req: Request,
    res: Response,
    callback: ApiCallback
  ): Promise<Content | ClientInfo | ClientInfo[]> {
    return await callback(req, res);
  }
  static withApiResponse(callback: ApiCallback) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await Middleware.protectedWrapper(req, res, callback);
        res.status(200).json(result);
        next();
      } catch (error: unknown) {
        next(error);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static errorHandlerMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
    res.status(500).send({
      error: err.message,
    });
  }
}
