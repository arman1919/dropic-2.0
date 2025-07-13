'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api/client';
import '../../../../styles/pages/AlbumEdit.css';
import MediaSelector from '../../../../components/media/MediaSelector';
import GalleryControls from '../../../../components/gallery/GalleryControls';
import PublicLinkSection from '../../../../components/albums/PublicLinkSection';
import NavBar from '../../../../components/ui/NavBar';
import PhotoEditModal from '../../../../components/media/PhotoEditModal';
import { CldImage } from 'next-cloudinary';

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
  description?: string;
}

const AlbumEditPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const router = useRouter();

  const [album, setAlbum] = useState<Album | null>(null);
  const [media, setMedia] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);

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
      setDescription(albumData.description || '');
      setMedia(mediaData);
      setSelectedIds(new Set(albumData.photos.map((p) => p.photoId)));
      setAlbumPhotos(albumData.photos);
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

  const toggleSelectMode = () => {
    setSelectMode((m) => {
      const next = !m;
      if (!next) {
        // leaving select mode, clear temp selection
        setSelectedForDelete(new Set());
      }
      return next;
    });
  };

  const selectAllImages = () => {
    setSelectedForDelete((prev) => {
      const allIds = media.filter((p) => selectedIds.has(p.photoId)).map((p) => p.photoId);
      if (prev.size === allIds.length) {
        return new Set();
      }
      return new Set(allIds);
    });
  };

  const deleteSelectedImages = () => {
    if (selectedForDelete.size === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectedForDelete.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedForDelete(new Set());
    setSelectMode(false);
  };

  const handleAddPhotos = (photos: Photo[]) => {
    // merge selected IDs with new ones
    setSelectedIds((prev) => {
      const next = new Set(prev);
      photos.forEach((p) => next.add(p.photoId));
      return next;
    });
    // добавляем новые фото в albumPhotos, если их ещё нет
    setAlbumPhotos((prev) => {
      const existingIds = new Set(prev.map((p) => p.photoId));
      const newPhotos = photos.filter((p) => !existingIds.has(p.photoId));
      return [...prev, ...newPhotos];
    });
    // также обновляем общий список media, чтобы счётчики и другое UI были корректны
    setMedia((prev) => {
      const existingIds = new Set(prev.map((p) => p.photoId));
      const newPhotos = photos.filter((p) => !existingIds.has(p.photoId));
      return [...prev, ...newPhotos];
    });
  };

  const handleEditPhoto = (photo: Photo) => {
    // Берём актуальное фото из albumPhotos
    const freshPhoto = albumPhotos.find((p) => p.photoId === photo.photoId) || photo;
    setEditingPhoto(freshPhoto);
    setIsEditModalOpen(true);
  };

  const handleSavePhoto = (updatedPhoto: any) => {
    setAlbumPhotos((prev) => prev.map((p) => p.photoId === updatedPhoto.photoId ? { ...p, ...updatedPhoto } : p));
    setEditingPhoto(null);
    setIsEditModalOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Собираем только выбранные фото с их актуальными свойствами
      const selectedPhotos = albumPhotos.filter((p) => selectedIds.has(p.photoId));
      await api.put(
        `/api/albums/${albumId}`,
        { title, photoIds: Array.from(selectedIds), description, photos: selectedPhotos },
        { headers: authHeaders }
      );
      // После успешного сохранения — получить свежий альбом и обновить состояние
      const res = await api.get(`/api/albums/${albumId}`, { headers: authHeaders });
      const albumData: Album = res.data.album;
      setAlbum(albumData);
      setAlbumPhotos(albumData.photos);
      setMedia(albumData.photos);
      setSelectedIds(new Set(albumData.photos.map((p) => p.photoId)));
      setSuccess('Изменения успешно сохранены');
      setTimeout(() => setSuccess(''), 3000);
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
        {success && <div className="notification success">{success}</div>}
        <h2 className="section-title">Редактирование альбома</h2>

        <div className="form-group">
          <h3 className="section-subtitle">Название альбома</h3>
          {isEditingTitle ? (
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              onBlur={() => setIsEditingTitle(false)}
              autoFocus
            />
          ) : (
            <div
              className="album-title"
              onClick={() => setIsEditingTitle(true)}
              style={{ cursor: 'pointer', minHeight: 32, color: title ? undefined : '#aaa' }}
            >
              {title || 'Без названия'}
            </div>
          )}
        </div>

        <div className="form-group">
          <h3 className="section-subtitle">Описание альбома</h3>
          {isEditingDescription ? (
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input edit-description-input"
              placeholder="Введите описание альбома..."
              rows={3}
              onBlur={() => setIsEditingDescription(false)}
              autoFocus
            />
          ) : (
            <div
              className="album-title"
              onClick={() => setIsEditingDescription(true)}
              style={{ cursor: 'pointer', minHeight: 32, color: description ? undefined : '#aaa' }}
            >
              {description || 'Добавить описание'}
            </div>
          )}
        </div>

        <div className="form-group">
          <h3 className="section-subtitle">Публичная ссылка на альбом:</h3>
          <PublicLinkSection albumId={albumId} />
        </div>

        <h3 className="section-subtitle">Выбранные фотографии</h3>

        <div className="add-images-actions" style={{ marginTop: '1rem' }}>
          <GalleryControls
              imagesCount={media.length}
              selectMode={selectMode}
              selectedCount={selectedForDelete.size}
              toggleSelectMode={toggleSelectMode}
              selectAllImages={selectAllImages}
              deleteSelectedImages={deleteSelectedImages}
            />

          <div className="actions" style={{ marginTop: '1rem' }}>
            <button className="add-images-button" onClick={() => setSelectorOpen(true)}>
              Добавить изображения
            </button>
          </div>

        </div>

        <div className="media-grid">
          {albumPhotos.filter((p) => p.photoId && selectedIds.has(p.photoId)).map((photo) => {
            const checked = selectedIds.has(photo.photoId);
            if (!photo.photoId) return null;
            return (
              <div
                key={photo.photoId}
                className={`image-container ${selectedForDelete.has(photo.photoId) ? 'selected' : ''}`}
                style={{ position: 'relative' }}
                onMouseEnter={e => {
                  const btn = e.currentTarget.querySelector('.edit-image-button');
                  if (btn) btn.classList.add('show-edit-btn');
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget.querySelector('.edit-image-button');
                  if (btn) btn.classList.remove('show-edit-btn');
                }}
                onClick={() => {
                  if (!selectMode) return;
                  setSelectedForDelete((prev) => {
                    const next = new Set(prev);
                    if (next.has(photo.photoId)) {
                      next.delete(photo.photoId);
                    } else {
                      next.add(photo.photoId);
                    }
                    return next;
                  });
                }}
              >
                <CldImage
                  config={{ cloud: { cloudName: 'dofxdkqoa' } }}
                  src={photo.photoId}
                  alt={photo.originalName || photo.filename}
                  className="gallery-image"
                  width="300"
                  height="300"
                  crop="fill"
                  gravity="auto"
                />
                <button
                  className="edit-image-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPhoto(photo);
                  }}
                  title="Редактировать"
                  style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s, transform 0.2s', transform: 'scale(0.9)' }}
                >
                  ✎
                </button>
                {!selectMode && (
                  <button
                    className="delete-image-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(photo.photoId);
                        return next;
                      });
                      setAlbumPhotos((prev) => prev.filter((p) => p.photoId !== photo.photoId));
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="edit-actions">
          <button className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className="secondary-button" onClick={() => router.push('/profile')} disabled={saving}>
            Отмена
          </button>
        </div>
        <MediaSelector
          isOpen={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          onSelect={handleAddPhotos}
        />
        <PhotoEditModal
          isOpen={isEditModalOpen}
          onClose={() => { setIsEditModalOpen(false); setEditingPhoto(null); }}
          photo={editingPhoto}
          onSave={handleSavePhoto}
        />
      </div>
    </div>
  );
};

export default AlbumEditPage;
