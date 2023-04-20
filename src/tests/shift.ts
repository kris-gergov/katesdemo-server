import { faker } from '@faker-js/faker';

import config from '@config/index';
import { signJwt } from '@utils/jwt.utils';
import User, { IUser } from '@models/user';
import db from '@/utils/db';
import { ObjectId } from 'mongoose';
import { DummyUser } from './user';

export type DummyShift = {
  id: string;
  email: string;
  password: string;
  name: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };
};

export function dummyShiftData(
  testClient: DummyUser,
  testCleaner: DummyUser,
): {
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
} {
  return {
    client: {
      id: testClient.id,
      name: testClient.name,
      email: testClient.email,
      phone: testClient.phone,
      address: testClient.address,
    },
    cleaner: {
      id: testCleaner.id,
      name: testCleaner.name,
    },
    date: faker.date.soon(),
    hours: faker.datatype.number({ min: 1, max: 10 }),
    amount: faker.datatype.number({ min: 10, max: 100 }),
  };
}

export function dummySummaryData(
  clientId: string,
  cleanerId: string,
): {
  client: string;
  cleaner: string;
  from: Date;
  to: Date;
} {
  return {
    client: clientId,
    cleaner: cleanerId,
    from: faker.date.past(),
    to: faker.date.future(),
  };
}
