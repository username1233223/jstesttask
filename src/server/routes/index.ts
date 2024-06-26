import express, { Request, Response, NextFunction } from 'express';
import {ClientsController} from '../controllers/clients';
import {Middleware} from '../middlewares';

const router = express.Router();

export function startRouter(port:number):any
{
    router.get('/', Middleware.withApiResponse(async (req: Request, res: Response) => {
        return ClientsController.getUdpClients();
    }));
    
    router.get('/:clientId', Middleware.withApiResponse(async (req: Request, res: Response) => {
        const clientId = req.params.clientId;
        const client = ClientsController.getUdpClients().find(c => c.clientId === clientId);
        
        if (!client) {
            throw new Error("No such client.");
        }
        return {
            capacities: client.capacities,
            logo: client.logo
        };
    }));
    
    router.get('/:clientId/:functionName', Middleware.withApiResponse(async (req: Request, res: Response) => {
        const { clientId, functionName } = req.params;
        const args = Object.values(req.query);
        return ClientsController.callClientFunction(clientId, functionName, args);
    }));
    
    router.use(Middleware.errorHandlerMiddleware);

    const app = express();

    app.use('/', router);
    app.listen(port, () => {
        console.log(`Express server is running on port ${port}`);
    });
}