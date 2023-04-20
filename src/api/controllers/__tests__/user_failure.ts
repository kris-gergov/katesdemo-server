import request from 'supertest';
import { Express } from 'express-serve-static-core';

import UserService from '@services/user';
import { createServer } from '@utils/server';
import { faker } from '@faker-js/faker';
import { dummyUserData } from '@tests/user';

jest.mock('@services/user');

let server: Express;
beforeAll(async () => {
  server = await createServer();
});

describe('auth failure', () => {
  it('should return 500 & valid response if auth rejects with an error', done => {
    // Mock user service auth method which will be called because this endpoint requires validation
    // and force it to reject with an error
    (UserService.auth as jest.Mock).mockRejectedValue(new Error());
    request(server)
      .get(`/api/v1/goodbye`)
      .set('Authorization', 'Bearer fakeToken')
      .expect(500)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
        done();
      });
  });
});

describe('createUser failure', () => {
  it('should return 500 & valid response if auth rejects with an error', done => {
    (UserService.createUser as jest.Mock).mockResolvedValue({ error: { type: 'unknown' } });
    request(server)
      .post(`/api/v1/user`)
      .send(dummyUserData('cleaner'))
      .expect(500)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
        done();
      });
  });
});

describe('login failure', () => {
  it('should return 500 & valid response if auth rejects with an error', done => {
    (UserService.login as jest.Mock).mockResolvedValue({ error: { type: 'unknown' } });
    request(server)
      .post(`/api/v1/login`)
      .send({
        email: faker.internet.email(),
        password: faker.internet.password(),
      })
      .expect(500)
      .end(function (err, res) {
        if (err) return done(err);
        expect(res.body).toMatchObject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
        done();
      });
  });
});
