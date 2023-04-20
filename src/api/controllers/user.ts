/**
 * For production code, you should add more tests for all corner cases, and also you can add
 * end to end unit tests calling a sequence of POST /api/v1/user, POST /api/v1/login, etc
 */

import * as express from 'express';

import UserService from '@services/user';
import { ErrorResponse } from '@services/user/user';
import { writeJsonResponse } from '@utils/express';
import logger from '@utils/logger';

export function auth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = req.headers.authorization!;

  UserService.auth(token)
    .then(authResponse => {
      if (!(authResponse as any).error) {
        res.locals.auth = {
          userId: (authResponse as { userId: string }).userId,
        };
        next();
      } else {
        writeJsonResponse(res, 401, authResponse);
      }
    })
    .catch(err => {
      writeJsonResponse(res, 500, {
        error: {
          type: 'internal_server_error',
          message: 'Internal Server Error',
        },
      });
    });
}

export function createUser(req: express.Request, res: express.Response): void {
  UserService.createUser(req.body)
    .then(resp => {
      if ((resp as any).error) {
        if ((resp as ErrorResponse).error.type === 'account_already_exists') {
          writeJsonResponse(res, 409, resp);
        } else {
          throw new Error(`unsupported ${resp}`);
        }
      } else {
        writeJsonResponse(res, 201, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`createUser: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function getUsers(req: express.Request, res: express.Response): void {
  UserService.getAllUsers()
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 200, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`createUser: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function getUser(req: express.Request, res: express.Response): void {
  UserService.getSingleUser({ id: req.params.id })
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 200, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`createUser: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function updateUser(req: express.Request, res: express.Response): void {
  UserService.updateUser({ _id: req.params.id }, req.body)
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 200, resp);
      }
    })
    .catch((err: any) => {
      logger.error(`createUser: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function deleteUser(req: express.Request, res: express.Response): void {
  UserService.deleteUser({ id: req.params.id })
    .then(resp => {
      if ((resp as any).error) {
        throw new Error(`unsupported ${resp}`);
      } else {
        writeJsonResponse(res, 204, '');
      }
    })
    .catch((err: any) => {
      logger.error(`createUser: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}

export function login(req: express.Request, res: express.Response): void {
  const { email, password } = req.body;

  UserService.login(email, password)
    .then(resp => {
      if ((resp as any).error) {
        if ((resp as ErrorResponse).error.type === 'invalid_credentials') {
          writeJsonResponse(res, 404, resp);
        } else {
          throw new Error(`unsupported ${resp}`);
        }
      } else {
        const { userId, token, expireAt } = resp as { token: string; userId: string; expireAt: Date };
        writeJsonResponse(res, 200, { userId: userId, token: token }, { 'X-Expires-After': expireAt.toISOString() });
      }
    })
    .catch((err: any) => {
      logger.error(`login: ${err}`);
      writeJsonResponse(res, 500, { error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    });
}
