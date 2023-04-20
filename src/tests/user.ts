import { faker } from '@faker-js/faker';

import config from '@config/index';
import { signJwt } from '@utils/jwt.utils';
import User from '@models/user';

export type DummyUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };
};

export type AuthorizedDummyUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };
  token: string;
};

export function dummyUserData(userType: string): {
  email: string;
  password: string;
  name: string;
  type: string;
  phone: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };
} {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    name: faker.name.firstName(),
    type: userType,
    phone: faker.phone.phoneNumber(),
    address: {
      street: faker.address.street(),
      city: faker.address.city(),
      postcode: faker.address.zipCode(),
    },
  };
}

export async function createDummyUser(userType: string = 'client'): Promise<DummyUser> {
  const user = dummyUserData(userType);
  const dbUser = new User(user);

  await dbUser.save();

  return { ...user, id: dbUser._id.toString() };
}

export async function createDummyUserAndAuthorize(userType: string = 'client'): Promise<AuthorizedDummyUser> {
  const user = await createDummyUser(userType);
  const accessToken = signJwt(
    { id: user.id! },
    { expiresIn: config.accessTokenTtl }, // 30 minutes
  );
  return { ...user, token: accessToken };
}
