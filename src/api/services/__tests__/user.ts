import { faker } from '@faker-js/faker';
import jwt, { Secret, SignCallback, SignOptions } from 'jsonwebtoken';

import { createDummyUser, createDummyUserAndAuthorize, dummyUserData } from '@tests/user';
import UserService from '../user/user';
import User from '@models/user';

import db from '@utils/db';

describe('user service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    await db.open();
  }, 10000);

  afterAll(async () => {
    await db.close();
  });

  describe('auth', () => {
    it('should resolve with true and valid userId for hardcoded token', async () => {
      const userService = UserService(User);
      const dummy = await createDummyUserAndAuthorize();
      await expect(userService.auth(dummy.token)).resolves.toEqual({ userId: dummy.id });
    });

    it('should resolve with false for invalid token', async () => {
      const userService = UserService(User);
      const response = await userService.auth('invalidToken');
      expect(response).toEqual({ error: { type: 'unauthorized', message: 'Authentication Failed' } });
    });
  });

  describe('login', () => {
    it('should return JWT token, userId, expireAt to a valid login/password', async () => {
      const dummy = await createDummyUser();
      const userService = UserService(User);

      await expect(userService.login(dummy.email, dummy.password)).resolves.toEqual({
        userId: dummy.id,
        token: expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/),
        expireAt: expect.any(Date),
      });
    });

    it('should reject with error if login does not exist', async () => {
      const { email, password } = await dummyUserData('client');
      const userService = UserService(User);
      await expect(userService.login(email, password)).resolves.toEqual({
        error: { type: 'invalid_credentials', message: 'Invalid Login/Password' },
      });
    });

    it('should reject with error if password is wrong', async () => {
      const dummy = await createDummyUser();
      const userService = UserService(User);
      await expect(userService.login(dummy.email, faker.internet.password())).resolves.toEqual({
        error: { type: 'invalid_credentials', message: 'Invalid Login/Password' },
      });
    });

    it('should return internal_server_error if jwt.sign fails with the error', async () => {
      (jwt.sign as any) = (
        payload: string | Buffer | object,
        secretOrPrivateKey: Secret,
        options: SignOptions,
        callback: SignCallback,
      ) => {
        callback(new Error('failure'), undefined);
      };

      const dummy = await createDummyUser();
      const userService = UserService(User);
      await expect(userService.login(dummy.email, dummy.password)).rejects.toEqual({
        error: { type: 'internal_server_error', message: 'Internal Server Error' },
      });
    });
  });

  describe('CRUD', () => {
    it('has a module', () => {
      expect(UserService).toBeDefined();
    });

    it('gets all users', async () => {
      User.find = jest.fn().mockResolvedValue(['user1', 'user2']);
      const userService = UserService(User);

      const expected = {
        users: ['user1', 'user2'],
      };

      await expect(userService.getAllUsers()).resolves.toEqual(expected);
    });

    it('gets a single user', async () => {
      User.findOne = jest.fn().mockResolvedValue('user1');
      const userService = UserService(User);

      const expected = {
        user: 'user1',
      };

      await expect(userService.getSingleUser({ id: 'testId' })).resolves.toEqual(expected);
    });

    it('creates a user', async () => {
      User.create = jest.fn().mockResolvedValue({ email: 'test@gmail.com', name: 'test' });
      User.prototype.save = jest.fn().mockResolvedValue({ _id: 'testId123' });
      const userService = UserService(User);

      const userData = dummyUserData('client');

      const expected = {
        userId: 'testId123',
      };

      await expect(userService.createUser(userData as any)).resolves.toEqual(expected);
    });

    it('updates a user', async () => {
      User.findOneAndUpdate = jest.fn().mockResolvedValue('updatedUser');
      const userService = UserService(User);
      const expected = {
        user: 'updatedUser',
      };

      await expect(userService.updateUser({ id: 'testId' }, { hours: 10 })).resolves.toEqual(expected);
    });

    it('deletes a user', async () => {
      User.deleteOne = jest.fn().mockResolvedValue(true);
      const userService = UserService(User);

      await expect(userService.deleteUser({ id: 'testId' })).resolves.toEqual(true);
    });
  });
});
