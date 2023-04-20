import { faker } from '@faker-js/faker';

import request from 'supertest';
import { Express } from 'express-serve-static-core';

import SessionService from '@services/session';
import UserService from '@services/user';
import db from '@utils/db';
import { createServer } from '@utils/server';
import { createDummyUser, DummyUser } from '@tests/user';
import { deleteSessionHandler, getSessionsHandler } from '../session';
import { getMockReq, getMockRes } from '@jest-mock/express';

const exampleSessionList = [
  {
    user: faker.database.mongodbObjectId(),
    valid: true,
    userAgent: 'testAgent1',
  },
  {
    user: faker.database.mongodbObjectId(),
    valid: true,
    userAgent: 'testAgent2',
  },
];

let server: Express;
let testUser1: DummyUser;
let testUser2: DummyUser;

beforeAll(async () => {
  await db.open();
  server = await createServer();

  testUser1 = await createDummyUser('client');
  testUser2 = await createDummyUser('cleaner');
}, 20000);

afterAll(async () => {
  await db.close();
  await new Promise<void>(resolve => setTimeout(() => resolve(), 2000)); // avoid jest open handle error
}, 5000);

describe('POST /api/v1/session', () => {
  it('should return 201 & valid response for valid session', async () => {
    const mock = jest
      .spyOn(SessionService, 'createSession')
      // @ts-ignore
      .mockResolvedValue({ user: testUser1.id, userAgent: 'testAgent' });
    // @ts-ignore
    const mock2 = jest.spyOn(UserService, 'validatePassword').mockResolvedValue(testUser1);
    faker;

    const res = await request(server)
      .post(`/api/v1/session`)
      .send({ email: testUser1.email, password: 'testPassword123' });

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      accessToken: expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/),
      refreshToken: expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/),
    });

    mock.mockRestore();
  });

  it('should return 400 & error response for an invalid request', async () => {
    const res = await request(server).post(`/api/v1/session`).send({ email: 'invalidemail' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/email/),
    });
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/password/),
    });
  });
});

describe('GET /api/v1/session', () => {
  it('should return 200 & valid response', async () => {
    // @ts-ignore
    const mockService = jest.spyOn(SessionService, 'findSessions').mockResolvedValue(exampleSessionList);
    const req = getMockReq();
    const { res, mockClear } = getMockRes({
      locals: {
        user: { _id: testUser1.id },
      },
    });

    await getSessionsHandler(req, res);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        sessions: exampleSessionList,
      }),
    );

    mockService.mockRestore();
    mockClear();
  });

  it('should error with a 401 when there is no authorised user', async () => {
    // @ts-ignore
    const res = await request(server).get(`/api/v1/session`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/'authorised'/),
    });
  });
});

describe('DELETE /api/v1/session/', () => {
  it('should return null tokens', async () => {
    const mockService = jest.spyOn(SessionService, 'updateSession').mockResolvedValue({
      // @ts-ignore
      session: exampleSessionList[0],
    });
    const req = getMockReq();
    const { res, mockClear } = getMockRes({
      locals: {
        user: { session: 'sessionId123' },
      },
    });

    await deleteSessionHandler(req, res);

    expect(mockService).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: null,
        refreshToken: null,
      }),
    );

    mockService.mockRestore();
    mockClear();
  });

  it('should error with a 401 when there is no authorised user', async () => {
    // @ts-ignore
    const res = await request(server).delete(`/api/v1/session`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/'authorised'/),
    });
  });
});
