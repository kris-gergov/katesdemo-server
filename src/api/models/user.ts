import bcrypt from 'bcrypt';
import { Schema, Document, model, Model, ObjectId } from 'mongoose';

import validator from 'validator';

interface IUserDocument extends Document {
  password: string;
  email: string;
  name: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    postcode: string;
  };
  deposit?: number;
  type: 'client' | 'cleaner' | 'admin';
  active: boolean;
  shifts?: ObjectId[];
}

export interface IUser extends IUserDocument {
  // document level operations
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, trim: true, validate: [validator.isEmail, 'do not match email regex'] },
    name: { type: String, required: true },
    phone: {
      type: String,
      minlength: 0,
    },
    address: {
      street: { type: String },
      city: { type: String },
      postcode: { type: String },
    },
    deposit: {
      type: Number,
    },
    type: {
      type: String,
      default: 'client',
      enum: ['client', 'cleaner', 'admin'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    shifts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
      },
    ],
  },
  { strict: true, timestamps: true },
).index({ email: 1 }, { unique: true, collation: { locale: 'en_US', strength: 1 }, sparse: true });

userSchema.pre<IUserDocument>('save', function (next): void {
  if (this.isModified('password')) {
    // generate hash for password
    bcrypt.genSalt(10, (err, salt) => {
      /* istanbul ignore next */
      if (err) return next(err);
      bcrypt.hash(this.password, salt, (err, hash) => {
        /* istanbul ignore next */
        if (err) return next(err);
        this.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.pre('find', function (next) {
  // @ts-ignore
  this.find({ active: { $ne: false }, type: { $ne: 'admin' } });
  next();
});

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    delete ret._id;
    delete ret.password;
  },
});

userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  const { password } = this;
  return new Promise(function (resolve, reject) {
    bcrypt.compare(candidatePassword, password, function (err, isMatch) {
      /* istanbul ignore next */
      if (err) return reject(err);
      return resolve(isMatch);
    });
  });
};

export interface IUserModel extends Model<IUser> {
  // collection/docouments level operations (fetch one or many, update, save back to db)
}

export const User: IUserModel = model<IUser, IUserModel>('User', userSchema);

export default User;
