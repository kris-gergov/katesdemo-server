import { Schema, Document, model, Model, ObjectId } from 'mongoose';
import User from './user';

export interface IShiftDocument extends Document {
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
  paid?: boolean;
  paymentDate?: Date;
  paymentMethod?: 'cash' | 'bank';
  commission?: number;
  notes?: string;
  isDeleted?: boolean;
}

export interface IShift extends IShiftDocument {
  // document level operations
}

const shiftSchema = new Schema<IShift>(
  {
    client: {
      id: {
        type: String,
        required: [true, 'Client id is required'],
      },
      name: {
        type: String,
        required: [true, 'Client name is required'],
      },
      email: {
        type: String,
        required: [true, 'Client email is required'],
      },
      phone: {
        type: String,
        required: [true, 'Client phone is required'],
      },
      address: {
        street: { type: String, required: [true, 'Address street is required'] },
        city: { type: String, required: [true, 'Address city is required'] },
        postcode: { type: String, required: [true, 'Address post code is required'] },
      },
    },
    cleaner: {
      type: {
        id: {
          type: String,
          required: [true, 'Cleaner id is required'],
        },
        name: {
          type: String,
          required: [true, 'Cleaner name is required'],
        },
      },
      required: [true, 'Cleaner is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    hours: {
      type: Number,
      required: [true, 'Hours is required'],
      min: 0,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be below 0'],
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank'],
      default: 'cash',
    },
    commission: {
      type: Number,
    },
    notes: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { strict: true, timestamps: true, toObject: { virtuals: true } },
).index({ email: 1 }, { unique: true, collation: { locale: 'en_US', strength: 1 }, sparse: true });

shiftSchema.virtual('amountPerHour').get(function (this: IShift) {
  return Number((this.amount / this.hours).toFixed(2));
});

shiftSchema.virtual('commissionPerHour').get(function () {
  if (this.commission) {
    return Number((this.commission / this.hours).toFixed(2));
  }
  return 0;
});

shiftSchema.pre('find', function (next) {
  this.where({ isDeleted: false });
  next();
});

shiftSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret.__v;
    delete ret._id;
  },
});

export interface IShiftModel extends Model<IShift> {
  // collection/docouments level operations (fetch one or many, update, save back to db)
}

export const Shift: IShiftModel = model<IShift, IShiftModel>('Shift', shiftSchema);

export default Shift;
