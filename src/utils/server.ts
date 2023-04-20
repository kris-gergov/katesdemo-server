import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as OpenApiValidator from 'express-openapi-validator';
import { Express } from 'express-serve-static-core';
import { connector } from 'swagger-routes-express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import morgan from 'morgan';
import morganBody from 'morgan-body';

import config from '../config';
import * as api from '../api/controllers';
import { expressDevLogger } from './express_dev_logger';
import logger from './logger';
import deserializeUser from '@middlewares/deserializeUser';

export async function createServer(): Promise<Express> {
  const yamlSpecFile = './src/config/openapi.yml';
  const apiDefinition = YAML.load(yamlSpecFile);
  logger.info('-----');
  logger.info('CONFIG', config);

  const server = express();

  server.use(cors({ origin: config.origin, credentials: true }));
  server.use(express.json());
  server.use(cookieParser());
  server.use(deserializeUser);

  if (config.morganLogger) {
    server.use(morgan(':method :url :status :response-time ms - :res[content-length]'));
  }

  if (config.morganBodyLogger) {
    morganBody(server);
  }

  if (config.exmplDevLogger) {
    server.use(expressDevLogger);
  }

  // setup API validator
  const validatorOptions = {
    apiSpec: yamlSpecFile,
    validateRequests: true,
    validateResponses: true,
  };

  server.use(OpenApiValidator.middleware(validatorOptions));

  server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDefinition));

  // error customization, if request is invalid
  server.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(err.status).json({
      error: {
        type: 'request_validation',
        message: err.message,
        errors: err.errors,
      },
    });
  });

  const connect = connector(api, apiDefinition, {
    onCreateRoute: (method: string, descriptor: any[]) => {
      descriptor.shift();
      logger.info(`${method}: ${descriptor.map((d: any) => d.name).join(', ')}`);
    },
    security: {
      bearerAuth: api.auth,
    },
  });

  connect(server);

  return server;
}
