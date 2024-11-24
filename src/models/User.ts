import mongoose, { Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  twitter: string;
  github: string;
  linkedin:string
}
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  twitter: {
    type: String,
    required: false
  },
  github: {
    type: String,
    required: false
  },
  linkedin: {
    type: String,
    required: false
  },
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
