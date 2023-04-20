import { model, Document, Types, Model, Schema } from 'mongoose';
import { IUser } from './user';

export interface SessionDocument extends Document {
  user: IUser['_id'];
  valid: boolean;
  userAgent: string;
}

const sessionSchema = new Schema(
  {
    user: { type: Types.ObjectId, required: true, ref: 'User' },
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
  },
  {
    timestamps: true,
  },
);

export interface ISessionModel extends Model<SessionDocument> {
  // collection/docouments level operations (fetch one or many, update, save back to db)
}

export const Session: ISessionModel = model<SessionDocument, ISessionModel>('Session', sessionSchema);

export default Session;
