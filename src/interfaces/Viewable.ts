import { Document, ObjectId } from 'mongoose';
import { IView } from '../models/View';

export interface Viewable extends Document {
    views?: IView[];
    view_count?: number;
}
