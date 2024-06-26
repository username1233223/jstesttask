import { Request, Response, NextFunction } from 'express';

export namespace Middleware{
    export function withApiResponse(callback: any) {
        return async (req: Request, res: Response, next: NextFunction) => {
          try {
            const result = await callback(req, res);
      
            res.status(200).json(result);
      
            next();
          } catch (error) {
            next(error);
          }
        };
      }
    
    export function errorHandlerMiddleware(
        err: Error,
        req: Request,
        res: Response,
        next: NextFunction
      ) {
        res.status(500).send(err.message);
      }
}
