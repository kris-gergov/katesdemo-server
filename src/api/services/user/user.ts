import jwt, { SignOptions, VerifyErrors, VerifyOptions } from 'jsonwebtoken';

import config from '../../../config';
import logger from '@utils/logger';
import { IUser, IUserModel } from '../../models/user';
import cacheLocal from '@utils/cache_local';
import { DocumentDefinition, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export type ErrorResponse = { error: { type: string; message: string } };
export type AuthResponse = ErrorResponse | { userId: string };
export type CreateUserResponse = ErrorResponse | { userId: string };
export type LoginUserResponse = ErrorResponse | { token: string; userId: string; expireAt: Date };
export type GetUsersResponse = ErrorResponse | { users: IUser[] };
export type GetUserResponse = ErrorResponse | { user: IUser };

const signOptions: SignOptions = {
  algorithm: 'RS256',
  expiresIn: '14d',
};

const verifyOptions: VerifyOptions = {
  algorithms: ['RS256'],
};

const publicKey = config.publicKey.replace(/\\n/gm, '\n');
const privateKey = config.privateKey.replace(/\\n/gm, '\n');

function createAuthToken(userId: string): Promise<{ token: string; expireAt: Date }> {
  return new Promise(function (resolve, reject) {
    jwt.sign({ userId: userId }, privateKey, signOptions, (err: Error | null, encoded: string | undefined) => {
      if (err === null && encoded !== undefined) {
        const expireAfter = 2 * 604800; /* two weeks */
        const expireAt = new Date();
        expireAt.setSeconds(expireAt.getSeconds() + expireAfter);

        resolve({ token: encoded, expireAt: expireAt });
      } else {
        reject(err);
      }
    });
  });
}

const login =
  (User: IUserModel) =>
  async (login: string, password: string): Promise<LoginUserResponse> => {
    try {
      let user: IUser | undefined | null = cacheLocal.get<IUser>(login);
      if (!user) {
        user = await User.findOne({ email: login }).select('+password');

        if (!user) {
          return { error: { type: 'invalid_credentials', message: 'Invalid Login/Password' } };
        }

        cacheLocal.set(user._id.toString(), user);
        cacheLocal.set(login, user);
      }

      const passwordMatch = await user.comparePassword(password);
      if (!passwordMatch) {
        return { error: { type: 'invalid_credentials', message: 'Invalid Login/Password' } };
      }

      const authToken = await createAuthToken(user._id.toString());
      return { userId: user._id.toString(), token: authToken.token, expireAt: authToken.expireAt };
    } catch (err) {
      logger.error(`login: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const validatePassword =
  (User: IUserModel) =>
  async ({ email, password }: { email: string; password: string }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return false;

    const isValid = await user.comparePassword(password);

    if (!isValid) return false;

    const { password: ignoredPassword, __v, createdAt, updatedAt, ...userToReturn } = user.toObject();

    return userToReturn;
  };

function auth(bearerToken: string): Promise<AuthResponse> {
  return new Promise(function (resolve, reject) {
    const token = bearerToken.replace('Bearer ', '');

    jwt.verify(token, publicKey, verifyOptions, (err: VerifyErrors | null, decoded: any) => {
      if (err === null && decoded !== undefined) {
        const d = decoded as { id?: string; exp: number };
        if (d.id) {
          resolve({ userId: d.id });
          return;
        }
      }
      resolve({ error: { type: 'unauthorized', message: 'Authentication Failed' } });
    });
  });
}

const createUser =
  (User: IUserModel) =>
  (input: DocumentDefinition<IUser>): Promise<CreateUserResponse> => {
    return new Promise(function (resolve, reject) {
      const user = new User({
        ...input,
      });

      user
        .save()
        .then(newUser => {
          resolve({ userId: newUser._id.toString() });
        })
        .catch(err => {
          if (err.code === 11000) {
            resolve({ error: { type: 'account_already_exists', message: `${input.email} already exists` } });
          } else {
            logger.error(`createUser: ${err}`);
            reject(err);
          }
        });
    });
  };

const getAllUsers =
  (User: IUserModel) =>
  async (query: FilterQuery<IUser> = {}, options: QueryOptions = { lean: true }): Promise<GetUsersResponse> => {
    try {
      const users: IUser[] = await User.find(query, {}, options);
      return { users };
    } catch (err) {
      logger.error(`getAllUsers: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const getSingleUser =
  (User: IUserModel) =>
  async (query: FilterQuery<IUser>, options: QueryOptions = { lean: true }): Promise<GetUserResponse> => {
    try {
      const user: IUser | null = await User.findOne(query, {}, options);
      if (!user) {
        return { error: { type: 'no_user_found', message: 'No such user exists with that specific id' } };
      }

      return { user };
    } catch (err) {
      logger.error(`getSingleUser: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const updateUser =
  (User: IUserModel) =>
  async (
    query: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    options: QueryOptions = { new: true, runValidators: true },
  ): Promise<GetUserResponse> => {
    try {
      const user: IUser | null = await User.findOneAndUpdate(query, update, options);
      if (!user) {
        return { error: { type: 'no_user_found', message: 'No such user exists with that specific id' } };
      }
      return { user };
    } catch (err) {
      logger.error(`updateUser: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const deleteUser =
  (User: IUserModel) =>
  async (query: FilterQuery<IUser>): Promise<ErrorResponse | boolean> => {
    try {
      await User.deleteOne(query);
      return true;
    } catch (err) {
      logger.error(`deleteUser: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

export default (User: IUserModel) => {
  return {
    auth,
    createAuthToken,
    login: login(User),
    validatePassword: validatePassword(User),
    createUser: createUser(User),
    getAllUsers: getAllUsers(User),
    getSingleUser: getSingleUser(User),
    updateUser: updateUser(User),
    deleteUser: deleteUser(User),
  };
};
