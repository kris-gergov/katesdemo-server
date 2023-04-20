import { faker } from '@faker-js/faker';

import request from 'supertest';
import { Express } from 'express-serve-static-core';

import db from '@utils/db';
import { createServer } from '@utils/server';
import { dummyUserData, createDummyUser } from '@tests/user';
import UserService from '@services/user';

let server: Express;

const exampleUserList = [
  {
    email: faker.internet.email(),
    name: faker.name.findName(),
    phone: faker.phone.phoneNumber(),
    address: {
      street: faker.address.street(),
      city: faker.address.city(),
      postcode: faker.address.zipCode(),
    },
    deposit: 50,
    active: true,
    type: 'client',
  },
  {
    email: faker.internet.email(),
    name: faker.name.findName(),
    phone: faker.phone.phoneNumber(),
    address: {
      street: faker.address.street(),
      city: faker.address.city(),
      postcode: faker.address.zipCode(),
    },
    deposit: 100,
    active: false,
    type: 'cleaner',
  },
];

beforeAll(async () => {
  await db.open();
  server = await createServer();
}, 20000);

afterAll(async () => {
  await db.close();
});

describe('POST /api/v1/user', () => {
  it('should return 201 & valid response for valid user', async () => {
    const fakeId = faker.database.mongodbObjectId();
    const mock = jest.spyOn(UserService, 'createUser').mockResolvedValue({ userId: fakeId });

    const res = await request(server).post(`/api/v1/user`).send(dummyUserData('client'));

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      userId: expect.stringMatching(fakeId),
    });

    mock.mockRestore();
  });

  it('should return 400 & error response for an invalid request', async () => {
    const res = await request(server).post(`/api/v1/user`).send({ email: 'invalidemail' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/email/),
    });
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/password/),
    });
  });

  it('should return 409 & valid response for duplicated user', async () => {
    const dummyUser = dummyUserData('client');

    await request(server)
      .post(`/api/v1/user`)
      .send({ ...dummyUser });

    const res = await request(server)
      .post(`/api/v1/user`)
      .send({ ...dummyUser });

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({
      error: {
        type: 'account_already_exists',
        message: expect.stringMatching(/already exists/),
      },
    });
  });
});

describe('GET /api/v1/user', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(UserService, 'getAllUsers').mockResolvedValue({
      // @ts-ignore
      users: exampleUserList,
    });

    const res = await request(server).get(`/api/v1/user`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.users[0].email).toBe(exampleUserList[0].email);
    expect(res.body.users[1].phone).toBe(exampleUserList[1].phone);

    mock.mockRestore();
  });
});

describe('GET /api/v1/user/:id', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(UserService, 'getSingleUser').mockResolvedValue({
      // @ts-ignore
      user: exampleUserList[0],
    });

    const res = await request(server).get(`/api/v1/user/${faker.database.mongodbObjectId()}`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.deposit).toBe(exampleUserList[0].deposit);

    mock.mockRestore();
  });

  it('should error with an invalid id', async () => {
    const res = await request(server).get(`/api/v1/user/badId123`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/id/),
    });
  });
});

describe('PATCH /api/v1/user/:id', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(UserService, 'updateUser').mockResolvedValue({
      // @ts-ignore
      user: exampleUserList[0],
    });

    const res = await request(server).patch(`/api/v1/user/${faker.database.mongodbObjectId()}`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.active).toBe(exampleUserList[0].active);

    mock.mockRestore();
  });

  it('should error with an invalid id', async () => {
    const res = await request(server).patch(`/api/v1/user/badId123`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/id/),
    });
  });
});

describe('DELETE /api/v1/user/:id', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(UserService, 'deleteUser').mockResolvedValue(true);

    const res = await request(server).delete(`/api/v1/user/${faker.database.mongodbObjectId()}`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(204);

    mock.mockRestore();
  });

  it('should error with an invalid id', async () => {
    const res = await request(server).delete(`/api/v1/user/badId123`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/id/),
    });
  });
});

describe('POST /api/v1/login', () => {
  it('should return 200 & valid response for a valid login request', async () => {
    const dummy = await createDummyUser();
    const res = await request(server).post(`/api/v1/login`).send({
      email: dummy.email,
      password: dummy.password,
    });

    expect(res.statusCode).toEqual(200);

    expect(res.header['x-expires-after']).toMatch(
      /^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,
    );
    expect(res.body).toEqual({
      userId: expect.stringMatching(/^[a-f0-9]{24}$/),
      token: expect.stringMatching(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/),
    });
  });

  it('should return 404 & valid response for a non-existing user', done => {
    request(server)
      .post(`/api/v1/login`)
      .send({
        email: faker.internet.email(),
        password: faker.internet.password(),
      })
      .expect(404)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).toEqual({
          error: { type: 'invalid_credentials', message: 'Invalid Login/Password' },
        });
        done();
      });
  });

  it('should return 400 & valid response for invalid request', done => {
    request(server)
      .post(`/api/v1/login`)
      .send({
        email: faker.internet.password(),
        password: faker.internet.password(),
      })
      .expect(400)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({
          error: { type: 'request_validation', message: expect.stringMatching(/email/) },
        });
        done();
      });
  });
});
