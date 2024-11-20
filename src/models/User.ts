import mongoose, { Document, ObjectId } from 'mongoose';

export interface UserInterface extends Document{
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
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
  }
}, {
  timestamps: true
});

export default mongoose.model<UserInterface>('User', UserSchema);
