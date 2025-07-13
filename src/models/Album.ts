import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPhoto {
  photoId: string;
  filename: string;
  originalName?: string;
  url: string;
  path?: string;
  uploadedAt?: Date;
  description?: string;
  description_hidden?: boolean;
  date?: Date | null;
  date_hidden?: boolean;
}

export interface IAlbum extends Document {
  albumId: string;
  userId: string;
  title: string;
  deleteToken: string;
  createdAt: Date;
  photos: IPhoto[];
  options?: Record<string, unknown>;
  theme?: string;
  description?: string;
  category?: string;
  password?: string | null;
  allowDownload?: boolean;
}

const photoSchema = new Schema<IPhoto>({
  photoId: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: String,
  url: { type: String, required: true },
  path: String,
  uploadedAt: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  description_hidden: { type: Boolean, default: false },
  date: { type: Date, default: null },
  date_hidden: { type: Boolean, default: false },
});

const albumSchema = new Schema<IAlbum>({
  albumId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, default: 'Untitled Album' },
  deleteToken: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  photos: [photoSchema],
  options: { type: Object, default: {} },
  theme: { type: String, default: 'default' },
  description: { type: String, default: '' },
  category: { type: String, default: 'uncategorized' },
  password: { type: String, default: null },
  allowDownload: { type: Boolean, default: true },
});

export default (mongoose.models.Album as Model<IAlbum>) || mongoose.model<IAlbum>('Album', albumSchema, 'album_dbs');
