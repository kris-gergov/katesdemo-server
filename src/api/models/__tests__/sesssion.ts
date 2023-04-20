/*
Write tests along with the model code step by step, not all at once
Run tests with --coverage to see if you missed something
For production development, add more extensive tests to check all corner cases
*/

import { faker } from '@faker-js/faker';

import Session from '@models/session';
import db from '@utils/db';

import { createDummyUser, DummyUser } from '@tests/user';

beforeAll(async () => {
  await db.open();
}, 10000);

afterAll(async () => {
  await db.close();
});

describe('save', () => {
  let testUser1: DummyUser;
  beforeAll(async () => {
    testUser1 = await createDummyUser('client');
  });

  it('should create session', async () => {
    const session = new Session({ user: testUser1.id, userAgent: '' });
    await session.save();

    const fetched = await Session.findById(session._id);
    expect(fetched).not.toBeNull();
    expect(fetched!.user.toString()).toBe(testUser1.id);
  });

  it('should update session', async () => {
    const session = new Session({ user: testUser1.id, userAgent: '' });
    const dbSession1 = await session.save();

    dbSession1.valid = false;
    const dbSession2 = await dbSession1.save();
    expect(dbSession2.valid).toEqual(false);
  });

  it('should delete session', async () => {
    const session = new Session({ user: testUser1.id, userAgent: '' });
    const dbSession1 = await session.save();

    await dbSession1.delete();

    const fetched = await Session.findById(session._id);
    expect(fetched).toBeNull();
  });

  it('should not save session without a userId', async () => {
    const session = new Session({ user: null, userAgent: '' });
    await expect(session.save()).rejects.toThrowError(/user/);
  });
});
