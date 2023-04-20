import { faker } from '@faker-js/faker';

import request from 'supertest';
import { Express } from 'express-serve-static-core';

import ShiftService from '@services/shift';
import db from '@utils/db';
import { createServer } from '@utils/server';
import { dummyShiftData, dummySummaryData } from '@tests/shift';
import { createDummyUser, DummyUser } from '@tests/user';
import User from '@models/user';
import Shift from '@models/shift';

const exampleShiftList = [
  {
    client: faker.database.mongodbObjectId(),
    cleaner: faker.database.mongodbObjectId(),
    date: faker.datatype.datetime(),
    hours: 5,
    amount: 50,
    paid: true,
    paymentDate: faker.datatype.datetime(),
    paymentMethod: 'cash',
    commission: 40,
    notes: 'N/A',
  },
  {
    client: faker.database.mongodbObjectId(),
    cleaner: faker.database.mongodbObjectId(),
    date: faker.datatype.datetime(),
    hours: 6,
    amount: 60,
    paid: true,
    paymentDate: faker.datatype.datetime(),
    paymentMethod: 'bank',
    commission: 55,
    notes: 'test note',
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

describe('POST /api/v1/shift', () => {
  it('should return 201 & valid response for valid shift', async () => {
    const mock = jest
      .spyOn(ShiftService, 'createShift')
      .mockResolvedValue({ shiftId: faker.database.mongodbObjectId() });
    const mock2 = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({});

    const res = await request(server).post(`/api/v1/shift`).send(dummyShiftData(testUser1, testUser2));

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      shiftId: expect.stringMatching(/^[a-f0-9]{24}$/),
    });

    mock.mockRestore();
  });

  it('should return 400 & error response for an invalid shift', async () => {
    const dummyShift = dummyShiftData(testUser1, testUser2);

    const res = await request(server)
      .post(`/api/v1/shift`)
      .send({ ...dummyShift, hours: null });

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/validation/),
    });
  });
});

describe('GET /api/v1/shift', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(ShiftService, 'getAllShifts').mockResolvedValue({
      // @ts-ignore
      shifts: exampleShiftList,
    });

    const res = await request(server).get(`/api/v1/shift`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.shifts[0].client).toBe(exampleShiftList[0].client);
    expect(res.body.shifts[1].amount).toBe(exampleShiftList[1].amount);

    mock.mockRestore();
  });
});

describe('GET /api/v1/shift/:id', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(ShiftService, 'getSingleShift').mockResolvedValue({
      // @ts-ignore
      shift: exampleShiftList[0],
    });

    const res = await request(server).get(`/api/v1/shift/${faker.database.mongodbObjectId()}`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.shift.cleaner).toBe(exampleShiftList[0].cleaner);

    mock.mockRestore();
  });

  it('should error with an invalid id', async () => {
    const res = await request(server).get(`/api/v1/shift/badId123`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/id/),
    });
  });
});

describe('PATCH /api/v1/shift/:id', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(ShiftService, 'updateShift').mockResolvedValue({
      // @ts-ignore
      shift: exampleShiftList[0],
    });

    const res = await request(server).patch(`/api/v1/shift/${faker.database.mongodbObjectId()}`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.shift.notes).toBe(exampleShiftList[0].notes);

    mock.mockRestore();
  });

  it('should error with an invalid id', async () => {
    const res = await request(server).patch(`/api/v1/shift/badId123`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/id/),
    });
  });
});

describe('DELETE /api/v1/shift/:id', () => {
  it('should return 200 & valid response', async () => {
    const mock = jest.spyOn(ShiftService, 'deleteShift').mockResolvedValue(true);

    const res = await request(server).delete(`/api/v1/shift/${faker.database.mongodbObjectId()}`);

    expect(mock).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(204);

    mock.mockRestore();
  });

  it('should error with an invalid id', async () => {
    const res = await request(server).delete(`/api/v1/shift/badId123`);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: expect.objectContaining(/id/),
    });
  });
});
