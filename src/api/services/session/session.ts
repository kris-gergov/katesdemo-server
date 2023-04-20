import { FilterQuery, UpdateQuery } from 'mongoose';
import { get } from 'lodash';
import { ISessionModel, SessionDocument } from '@models/session';
import { verifyJwt, signJwt } from '@utils/jwt.utils';
import UserService from '@services/user';
import config from '../../../config';

const createSession = (Session: ISessionModel) => async (userId: string, userAgent: string) => {
  const session = await Session.create({ user: userId, userAgent });
  return session;
};

const findSessions = (Session: ISessionModel) => async (query: FilterQuery<SessionDocument>) => {
  return Session.find(query);
};

const updateSession =
  (Session: ISessionModel) => async (query: FilterQuery<SessionDocument>, update: UpdateQuery<SessionDocument>) => {
    return Session.updateOne(query, update);
  };

const reIssueAccessToken =
  (Session: ISessionModel) =>
  async ({ refreshToken }: { refreshToken: string }) => {
    const { decoded } = verifyJwt(refreshToken);
    const sessionId = get(decoded, 'session', '');

    // if refresh token is invalid or there is no session id (to make sure the session is still valid)
    if (!decoded || !sessionId) return false;

    const session = await Session.findById(sessionId);

    if (!session || !session.valid) return false;

    const user = await UserService.getSingleUser(session.user);

    if (!user) return false;

    const accessToken = signJwt(
      { ...user, session: session._id },
      { expiresIn: config.accessTokenTtl }, // 15 minutes
    );

    return accessToken;
  };

export default (Session: ISessionModel) => {
  return {
    createSession: createSession(Session),
    findSessions: findSessions(Session),
    updateSession: updateSession(Session),
    reIssueAccessToken: reIssueAccessToken(Session),
  };
};
