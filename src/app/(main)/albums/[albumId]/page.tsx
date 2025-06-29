'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api/client';
import '../../../../styles/pages/AlbumEdit.css';
import NavBar from '../../../../components/ui/NavBar';

interface Photo {
  photoId: string;
  url: string;
  filename: string;
  originalName?: string;
}

interface Album {
  albumId: string;
  title: string;
  photos: Photo[];
}

const AlbumEditPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const router = useRouter();

  const [album, setAlbum] = useState<Album | null>(null);
  const [media, setMedia] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

  // helpers
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchData = async () => {
    try {
      const [albumRes, mediaRes] = await Promise.all([
        api.get(`/api/albums/${albumId}`, { headers: authHeaders }),
        api.get('/api/media', { headers: authHeaders }),
      ]);

      const albumData: Album = albumRes.data.album;
      const mediaData: Photo[] = mediaRes.data.media;

      setAlbum(albumData);
      setTitle(albumData.title);
      setMedia(mediaData);
      setSelectedIds(new Set(albumData.photos.map((p) => p.photoId)));
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/auth');
      } else {
        setError(err.response?.data?.message || 'Не удалось загрузить данные');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  const toggleSelect = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await api.put(
        `/api/albums/${albumId}`,
        { title, photoIds: Array.from(selectedIds) },
        { headers: authHeaders }
      );
      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  if (error) {
    return (
      <div>
        <NavBar />
        <div className="notification error">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="album-edit-container">
        <h2>Редактирование альбома</h2>

        <div className="form-group">
          <label htmlFor="title">Название альбома</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
          />
        </div>

        <h3>Выберите фотографии</h3>
        <div className="media-grid">
          {media.map((photo) => {
            const checked = selectedIds.has(photo.photoId);
            return (
              <div
                key={photo.photoId}
                className={`media-item ${checked ? 'selected' : ''}`}
                onClick={() => toggleSelect(photo.photoId)}
              >
                <img src={photo.url} alt={photo.originalName || photo.filename} />
              </div>
            );
          })}
        </div>

        <div className="actions">
          <button className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className="secondary-button" onClick={() => router.push('/profile')} disabled={saving}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlbumEditPage;
