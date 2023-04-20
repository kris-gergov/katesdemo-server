/*
Write tests along with the model code step by step, not all at once
Run tests with --coverage to see if you missed something
For production development, add more extensive tests to check all corner cases
*/

import { faker } from '@faker-js/faker';

import Shift from '@models/shift';
import db from '@utils/db';

import { createDummyUser, DummyUser } from '@tests/user';
import { dummyShiftData } from '@tests/shift';

beforeAll(async () => {
  await db.open();
}, 10000);

afterAll(async () => {
  await db.close();
});

describe('save', () => {
  let testUser1: DummyUser;
  let testUser2: DummyUser;

  beforeAll(async () => {
    testUser1 = await createDummyUser('client');
    testUser2 = await createDummyUser('cleaner');
  });

  let shiftData: {
    client: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: {
        street: string;
        city: string;
        postcode: string;
      };
    };
    cleaner: {
      id: string;
      name: string;
    };
    date: Date;
    hours: number;
    amount: number;
  };

  beforeEach(() => {
    shiftData = dummyShiftData(testUser1, testUser2);
  });

  it('should create shift', async () => {
    const shift = new Shift({ ...shiftData });
    await shift.save();

    const fetched = await Shift.findById(shift._id);
    expect(fetched).not.toBeNull();

    // Must use ts-ignore due to mongoose populate method

    // @ts-ignore
    expect(fetched!.client.name).toBe(testUser1.name);
    // @ts-ignore
    expect(fetched!.cleaner.name).toBe(testUser2.name);
    expect(fetched!.hours).toBe(shiftData.hours);
    expect(fetched!.amount).toBe(shiftData.amount);
    expect(fetched!.date).toEqual(shiftData.date);
  });

  it('should update shift', async () => {
    const shift = new Shift({ ...shiftData });
    const dbShift1 = await shift.save();

    const newPaymentDate = faker.date.recent();
    dbShift1.paymentDate = newPaymentDate;
    dbShift1.paid = true;
    const dbShift2 = await dbShift1.save();
    expect(dbShift2.paid).toEqual(true);
    expect(dbShift2.paymentDate).toEqual(newPaymentDate);
  });

  it('should delete shift', async () => {
    const shift = new Shift({ ...shiftData });
    const dbShift1 = await shift.save();

    await dbShift1.delete();

    const fetched = await Shift.findById(shift._id);
    expect(fetched).toBeNull();
  });

  it('should not save shift without a date', async () => {
    const shift = new Shift({ ...shiftData, date: null });
    await expect(shift.save()).rejects.toThrowError(/date/);
  });

  it('should not save shift without a client', async () => {
    const shift = new Shift({ ...shiftData, client: null });
    await expect(shift.save()).rejects.toThrowError(/client/);
  });

  it('should not save shift without a cleaner', async () => {
    const shift = new Shift({ ...shiftData, cleaner: null });
    await expect(shift.save()).rejects.toThrowError(/cleaner/);
  });

  it('should not save shift without hours', async () => {
    const shift = new Shift({ ...shiftData, hours: null });
    await expect(shift.save()).rejects.toThrowError(/hours/);
  });

  it('should not save shift without an amount', async () => {
    const shift = new Shift({ ...shiftData, amount: null });
    await expect(shift.save()).rejects.toThrowError(/amount/);
  });

  it('should return correct virtual properties', async () => {
    const shift = new Shift({ ...shiftData, commission: 20 });
    await shift.save();

    const jsonShift = shift.toJSON();
    expect(jsonShift.amountPerHour).toEqual(Number((shiftData.amount / shiftData.hours).toFixed(2)));
    expect(jsonShift.commissionPerHour).toEqual(Number((20 / shiftData.hours).toFixed(2)));
  });

  it('should return not return deleted shifts', async () => {
    const shift2 = new Shift({ ...shiftData, isDeleted: true });
    await shift2.save();

    const fetched = await Shift.find();
    expect(fetched.find(element => element.id === shift2.id)).toBeUndefined(); // i.e. deleted shift is not returned
  });
});
