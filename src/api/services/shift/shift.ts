import logger from '@utils/logger';
import { DocumentDefinition, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { IShift, IShiftDocument, IShiftModel } from '../../models/shift';

export type ErrorResponse = { error: { type: string; message: string } };
export type AuthResponse = ErrorResponse | { shiftId: string };
export type CreateShiftResponse = ErrorResponse | { shiftId: string };
export type LoginShiftResponse = ErrorResponse | { token: string; shiftId: string; expireAt: Date };
export type GetShiftsResponse = ErrorResponse | { shifts: IShiftDocument[] };
export type GetShiftResponse = ErrorResponse | { shift: IShift };

const createShift =
  (Shift: IShiftModel) =>
  async (input: DocumentDefinition<IShift>): Promise<CreateShiftResponse> => {
    return new Promise(function (resolve, reject) {
      const shift = new Shift({ ...input });

      shift
        .save()
        .then(newShift => {
          resolve({ shiftId: newShift._id.toString() });
        })
        .catch(err => {
          logger.error(`createShift: ${err}`);
          reject(err);
        });
    });
  };

const getAllShifts =
  (Shift: IShiftModel) =>
  async (query: FilterQuery<IShift> = {}, options: QueryOptions = { lean: true }): Promise<GetShiftsResponse> => {
    try {
      const shifts: IShift[] = await Shift.find(query, {}, options);
      return { shifts };
    } catch (err) {
      logger.error(`getAllShifts: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const getSingleShift =
  (Shift: IShiftModel) =>
  async (query: FilterQuery<IShift>, options: QueryOptions = { lean: true }): Promise<GetShiftResponse> => {
    try {
      const shift: IShift | null = await Shift.findOne(query, {}, options);
      if (!shift) {
        return { error: { type: 'no_shift_found', message: 'No shift found' } };
      }

      return { shift };
    } catch (err) {
      logger.error(`getSignleShift: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const updateShift =
  (Shift: IShiftModel) =>
  async (
    query: FilterQuery<IShift>,
    update: UpdateQuery<IShift>,
    options: QueryOptions = { runValidators: true },
  ): Promise<GetShiftResponse> => {
    try {
      const shift: IShift | null = await Shift.findOneAndUpdate(query, update, options);

      if (!shift) {
        return { error: { type: 'no_shift_found', message: 'No such shift exists with that specific id' } };
      }
      return { shift };
    } catch (err) {
      logger.error(`updateShift: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

const deleteShift =
  (Shift: IShiftModel) =>
  async (query: FilterQuery<IShift>): Promise<ErrorResponse | boolean> => {
    try {
      await Shift.deleteOne(query);
      return true;
    } catch (err) {
      logger.error(`deleteShift: ${err}`);
      return Promise.reject({ error: { type: 'internal_server_error', message: 'Internal Server Error' } });
    }
  };

export default (Shift: IShiftModel) => {
  return {
    createShift: createShift(Shift),
    getAllShifts: getAllShifts(Shift),
    getSingleShift: getSingleShift(Shift),
    updateShift: updateShift(Shift),
    deleteShift: deleteShift(Shift),
  };
};
