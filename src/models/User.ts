import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  media: any[];
  albums: any[];
}

const userSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  media: { type: [Object], default: [] },
  albums: { type: [Object], default: [] },
});

export default (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema, 'users_dbs');
