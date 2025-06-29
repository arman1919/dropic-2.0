export interface Image {
  _id?: string;
  id?: string;
  photoId: string; // Обязателен для dnd-kit и многих операций
  filename: string;
  originalName?: string;
  path?: string;
  url: string;
  description?: string;
  description_hidden?: boolean;
  date?: string;
  date_hidden?: boolean;
}

export interface AlbumOptions {
  autoNext?: boolean;
  delay?: number;
}
