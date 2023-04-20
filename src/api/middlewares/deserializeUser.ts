import { get } from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../../utils/jwt.utils';
import SessionService from '@services/session';

const deserializeUser = async (req: Request, res: Response, next: NextFunction) => {
  // Get the bearer token from headers, if it's not there, return empty string
  // If it is, remove the "Bearer" part so we are left with only the token
  const accessToken = get(req, 'cookies.accessToken') || get(req, 'headers.authorization', '').replace(/^Bearer\s/, '');

  const refreshToken = get(req, 'cookies.refreshToken') || get(req, 'headers.x-refresh', '');

  if (!accessToken) return next();

  const { decoded, expired } = verifyJwt(accessToken);

  if (decoded) {
    res.locals.user = decoded;
    return next();
  }

  if (expired && refreshToken) {
    const newAcessToken = await SessionService.reIssueAccessToken({ refreshToken });

    if (newAcessToken) {
      res.setHeader('x-access-token', newAcessToken);
      res.cookie('accessToken', newAcessToken, {
        maxAge: 900000,
        httpOnly: true,
        domain: 'localhost',
        path: '/',
        sameSite: 'strict',
        secure: false,
      });

      const result = verifyJwt(newAcessToken);

      res.locals.user = result.decoded;
      return next();
    }
  }

  return next();
};

export default deserializeUser;
