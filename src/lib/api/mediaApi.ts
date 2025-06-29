import api from './client';

export const deleteMedia = (photoId: string) =>
  api.delete(`/api/media/${photoId}`);