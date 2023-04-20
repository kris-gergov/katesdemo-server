/*
Write tests along with the model code step by step, not all at once
Run tests with --coverage to see if you missed something
For production development, add more extensive tests to check all corner cases
*/

import { faker } from '@faker-js/faker';

import User from '@models/user';
import db from '@utils/db';

beforeAll(async () => {
  await db.open();
}, 10000);

afterAll(async () => {
  await db.close();
});

describe('save', () => {
  it('should create user', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    const name = faker.name.firstName();

    const user = new User({ email: email, password: password, name: name });
    await user.save();

    const fetched = await User.findById(user._id);

    expect(fetched).not.toBeNull();

    expect(fetched!.email).toBe(email);
    expect(fetched!.name).toBe(name);
    expect(fetched!.password).not.toBe(password);
  });

  it('should update user', async () => {
    const name1 = faker.name.firstName();
    const user = new User({ email: faker.internet.email(), password: faker.internet.password(), name: name1 });
    const dbUser1 = await user.save();

    const name2 = faker.name.firstName();
    dbUser1.name = name2;
    const dbUser2 = await dbUser1.save();
    expect(dbUser2.name).toEqual(name2);
  });

  it('should delete shift', async () => {
    const name1 = faker.name.firstName();
    const user = new User({ email: faker.internet.email(), password: faker.internet.password(), name: name1 });
    const dbUser1 = await user.save();

    await dbUser1.delete();

    const fetched = await User.findById(user._id);
    expect(fetched).toBeNull();
  });

  it('does not return inactive users', async () => {
    const name1 = faker.name.firstName();
    const user = new User({
      email: faker.internet.email(),
      password: faker.internet.password(),
      name: name1,
      active: false,
    });
    const dbUser1 = await user.save();

    const fetched = await User.find();
    expect(fetched.find(element => element.id === dbUser1.id)).toBeUndefined(); // i.e. inactive user is not returned
  });

  it('should not save user with invalid email', async () => {
    const user1 = new User({ email: 'email@em.o', password: faker.internet.password() });
    await expect(user1.save()).rejects.toThrowError(/do not match email regex/);
  });

  it('should not save user without an email', async () => {
    const user = new User({ password: faker.internet.password(), name: faker.name.firstName() });
    await expect(user.save()).rejects.toThrowError(/email/);
  });

  it('should not save user without a password', async () => {
    const user2 = new User({ email: faker.internet.email(), name: faker.name.firstName() });
    await expect(user2.save()).rejects.toThrowError(/password/);
  });

  it('should not save user without a name', async () => {
    const user1 = new User({ email: faker.internet.email(), password: faker.internet.password() });
    await expect(user1.save()).rejects.toThrowError(/name/);
  });

  it('should not save user with the same email', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    const name = faker.name.firstName();
    const userData = { email: email, password: password, name: name };

    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData);
    await expect(user2.save()).rejects.toThrowError(/E11000/);
  });

  it('should not save password in a readable form', async () => {
    const password = faker.internet.password();

    const user1 = new User({ email: faker.internet.email(), password: password, name: faker.name.firstName() });
    await user1.save();
    expect(user1.password).not.toBe(password);

    const user2 = new User({ email: faker.internet.email(), password: password, name: faker.name.firstName() });
    await user2.save();
    expect(user2.password).not.toBe(password);

    expect(user1.password).not.toBe(user2.password);
  });
});

describe('comparePassword', () => {
  it('should return true for valid password', async () => {
    const password = faker.internet.password();
    const user = new User({ email: faker.internet.email(), password: password, name: faker.name.firstName() });
    await user.save();
    expect(await user.comparePassword(password)).toBe(true);
  });

  it('should return false for invalid password', async () => {
    const user = new User({
      email: faker.internet.email(),
      password: faker.internet.password(),
      name: faker.name.firstName(),
    });
    await user.save();
    expect(await user.comparePassword(faker.internet.password())).toBe(false);
  });

  it('should update password hash if password is updated', async () => {
    const password1 = faker.internet.password();
    const user = new User({ email: faker.internet.email(), password: password1, name: faker.name.firstName() });
    const dbUser1 = await user.save();
    expect(await dbUser1.comparePassword(password1)).toBe(true);

    const password2 = faker.internet.password();
    dbUser1.password = password2;
    const dbUser2 = await dbUser1.save();
    expect(await dbUser2.comparePassword(password2)).toBe(true);
    expect(await dbUser2.comparePassword(password1)).toBe(false);
  });
});

describe('toJSON', () => {
  it('should return valid JSON', async () => {
    const email = faker.internet.email();
    const password = faker.internet.password();
    const name = faker.name.firstName();

    const user = new User({ email: email, password: password, name: name });
    await user.save();
    expect(user.toJSON()).toEqual({
      email: email,
      name: name,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      active: true,
      id: expect.anything(),
      type: 'client',
      shifts: expect.any(Array),
    });
  });
});
