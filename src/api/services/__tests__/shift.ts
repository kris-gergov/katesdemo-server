import ShiftService from '../shift/shift';
import Shift from '@models/shift';
import { dummyShiftData } from '@tests/shift';
import { createDummyUser } from '@tests/user';
import db from '@utils/db';

describe('shift service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    await db.open();
  }, 10000);

  afterAll(async () => {
    await db.close();
  });

  it('has a module', () => {
    expect(ShiftService).toBeDefined();
  });

  it('gets all shifts', async () => {
    Shift.find = jest.fn().mockResolvedValue(['shift1', 'shift2']);
    const shiftService = ShiftService(Shift);

    const expected = {
      shifts: ['shift1', 'shift2'],
    };

    await expect(shiftService.getAllShifts()).resolves.toEqual(expected);
  });

  it('gets a single shift', async () => {
    Shift.findOne = jest.fn().mockResolvedValue('shift1');
    const shiftService = ShiftService(Shift);

    const expected = {
      shift: 'shift1',
    };

    await expect(shiftService.getSingleShift({ id: 'testId' })).resolves.toEqual(expected);
  });

  it('creates a shift', async () => {
    const testUser1 = await createDummyUser('client');
    const testUser2 = await createDummyUser('cleaner');

    Shift.create = jest.fn().mockResolvedValue({ client: 'client1', cleaner: 'cleaner2' });
    Shift.prototype.save = jest.fn().mockResolvedValue({ _id: 'testId123' });
    const shiftService = ShiftService(Shift);

    const shiftData = dummyShiftData(testUser1, testUser2);

    const expected = {
      shiftId: 'testId123',
    };

    await expect(shiftService.createShift(shiftData)).resolves.toEqual(expected);
  });

  it('updates a shift', async () => {
    Shift.findOneAndUpdate = jest.fn().mockResolvedValue('updatedShift');
    const shiftService = ShiftService(Shift);
    const expected = {
      shift: 'updatedShift',
    };

    await expect(shiftService.updateShift({ id: 'testId' }, { hours: 10 })).resolves.toEqual(expected);
  });

  it('deletes a shift', async () => {
    Shift.deleteOne = jest.fn().mockResolvedValue(true);
    const shiftService = ShiftService(Shift);

    await expect(shiftService.deleteShift({ id: 'testId' })).resolves.toEqual(true);
  });
});
