import { CookieOptions, Request, Response } from 'express';
import SessionService from '@services/session';
import UserService from '../services/user';
import { signJwt } from '../../utils/jwt.utils';
import config from '../../config';

const accessTokenCookieOptions: CookieOptions = {
  maxAge: 1800000, // in ms, equivalent of 15 mins
  httpOnly: true, // cannot be accessed with js, good security feature
  domain: 'localhost', // should be changed in product (need env/config variable)
  path: '/',
  sameSite: 'lax',
  secure: false, // should be changed in product (need env/config variable)
};

const refreshTokenCookieOptions: CookieOptions = {
  ...accessTokenCookieOptions,
  maxAge: 3.154e10, // in ms, equivalent of 1 year
};

export async function createSessionHandler(req: Request, res: Response) {
  // Validate password
  const user = await UserService.validatePassword(req.body);
  if (!user) return res.status(401).send('Invalid email or password');

  // Create session
  const session = await SessionService.createSession(user._id as string, req.get('user-agent') || '');

  // Create access token
  const accessToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.accessTokenTtl }, // 15 minutes
  );

  // Create refresh token
  const refreshToken = signJwt(
    { ...user, session: session._id },
    { expiresIn: config.refreshTokenTtl }, // 1 year
  );

  res.cookie('accessToken', accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  // Return tokens
  return res.status(201).send({ accessToken, refreshToken });
}

export async function getSessionsHandler(req: Request, res: Response) {
  const userId = res.locals?.user?._id;

  if (!userId) return res.status(401).send({ error: 'Not authorized' });

  const sessions = await SessionService.findSessions({ user: userId, valid: true });

  return res.status(200).send({ sessions });
}

// i.e. Logout
export async function deleteSessionHandler(req: Request, res: Response) {
  const sessionId = res.locals?.user?.session;

  if (!sessionId) return res.status(401).send({ error: 'Not authorized' });

  await SessionService.updateSession({ _id: sessionId }, { valid: false });

  return res.send({
    accessToken: null,
    refreshToken: null,
  });
}
