'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import '../../../styles/pages/Profile.css'; // Исправленный путь
import api from '../../../lib/api/client';
import { AxiosError } from 'axios';

// Определяем тип Album в соответствии с моделью на бэкенде
interface Album {
  _id: string;
  albumId: string;
  title: string;
  createdAt: string;
  photoCount: number;
  deleteToken?: string;
}

const UserProfile = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAlbums = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        setLoading(true);
        const response = await api.get<{ albums: Album[] }>('/api/albums', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const fetchedAlbums = response.data.albums || [];

        fetchedAlbums.forEach(album => {
          if (album.deleteToken) {
            localStorage.setItem(`album_delete_token_${album.albumId}`, album.deleteToken);
          }
        });

        setAlbums(fetchedAlbums);
      } catch (err) {
        console.error('Ошибка при загрузке альбомов:', err);
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 401) {
          localStorage.removeItem('userToken');
          router.push('/auth');
        } else {
          setError('Не удалось загрузить ваши альбомы. Попробуйте обновить страницу.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAlbums();
  }, [router]);

  const createNewAlbum = () => {
    router.push('/albums/create');
  };

  const toggleSelectMode = () => {
    setSelectMode(prevMode => !prevMode);
    if (selectMode) {
      setSelectedAlbums([]);
    }
  };

  const toggleAlbumSelection = (albumId: string) => {
    setSelectedAlbums(prevSelected =>
      prevSelected.includes(albumId)
        ? prevSelected.filter(id => id !== albumId)
        : [...prevSelected, albumId]
    );
  };

  const selectAllAlbums = () => {
    if (selectedAlbums.length === albums.length) {
      setSelectedAlbums([]);
    } else {
      const allAlbumIds = albums.map(album => album.albumId);
      setSelectedAlbums(allAlbumIds);
    }
  };

  const handleDelete = async (albumIds: string[]) => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
        router.push('/auth');
        return;
    }

    try {
      const deletePromises = albumIds.map(albumId => {
        const deleteToken = localStorage.getItem(`album_delete_token_${albumId}`);
        if (!deleteToken) {
            throw new Error(`Токен для удаления альбома ${albumId} не найден.`);
        }
        return api.delete(`/api/albums/${albumId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
            params: { token: deleteToken }
        });
      });

      await Promise.all(deletePromises);

      albumIds.forEach(albumId => {
        localStorage.removeItem(`album_delete_token_${albumId}`);
      });

      setAlbums(prevAlbums => prevAlbums.filter(album => !albumIds.includes(album.albumId)));
      setSelectedAlbums([]);
      if (selectMode) {
        setSelectMode(false);
      }
    } catch (err) {
      console.error('Ошибка при удалении альбомов:', err);
      const errorMessage = err instanceof Error ? err.message : 'Убедитесь, что у вас есть права на это действие.';
      setError(`Не удалось удалить выбранные альбомы. ${errorMessage}`);
    }
  };
  
  const confirmAndDelete = (e: MouseEvent<HTMLButtonElement> | null, albumIds: string[], single: boolean) => {
    if (e) e.stopPropagation();

    if (albumIds.length === 0) return;

    const message = single
      ? 'Вы уверены, что хотите удалить этот альбом?'
      : `Вы уверены, что хотите удалить ${albumIds.length} выбранных альбомов?`;

    confirmAlert({
      title: 'Подтверждение удаления',
      message,
      buttons: [
        {
          label: 'Да, удалить',
          onClick: () => handleDelete(albumIds)
        },
        {
          label: 'Отмена'
        }
      ]
    });
  };

  const handleCardClick = (albumId: string) => {
    if (selectMode) {
      toggleAlbumSelection(albumId);
    } else {
      router.push(`/albums/${albumId}`);
    }
  };
  
  const handleButtonClick = (e: MouseEvent<HTMLButtonElement>, action: () => void) => {
    e.stopPropagation();
    action();
  };

  if (loading) {
    return (
      <div className="loading-container" suppressHydrationWarning={true}>
        <div className="loading-spinner" suppressHydrationWarning={true}></div>
        <p className="loading-text">Загрузка альбомов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" suppressHydrationWarning={true}>
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="content-container" suppressHydrationWarning={true}>
      <div className="content-header">
        <h1 className="page-title">Мои Альбомы</h1>
        
        <div className="btn-group">
          <button
            onClick={toggleSelectMode}
            className={`btn ${selectMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {selectMode ? 'Завершить выбор' : 'Выбрать альбомы'}
          </button>
          
          {selectMode && (
            <>
              <button
                onClick={selectAllAlbums}
                className="btn btn-secondary"
              >
                {selectedAlbums.length === albums.length ? 'Снять выделение' : 'Выбрать все'}
              </button>
              
              <button
                onClick={() => confirmAndDelete(null, selectedAlbums, false)}
                disabled={selectedAlbums.length === 0}
                className="btn btn-danger"
              >
                Удалить выбранные ({selectedAlbums.length})
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="albums-grid" suppressHydrationWarning={true}>
        {albums.map((album, index) => {
          const isSelected = selectedAlbums.includes(album.albumId);
          
          return (
            <div
              key={album.albumId}
              className={`album-card ${isSelected ? 'selected' : ''} animate-fade-in-up`}
              style={{animationDelay: `${index * 0.05}s`} }
              onClick={() => handleCardClick(album.albumId)}
            >
              {album.photoCount > 0 && (
                <div className="album-badge album-badge-photos">
                  {album.photoCount} фото
                </div>
              )}
              
              <div className="album-card-header">
                <h2 className="album-card-title">{album.title || 'Без названия'}</h2>
                <div className="album-card-meta">
                  <span>
                    <i className="far fa-calendar"></i> 
                    {new Date(album.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="album-card-footer">
                <div className="btn-group">
                  <button
                    onClick={(e) => handleButtonClick(e, () => router.push(`/albums/${album.albumId}`))}
                    className="btn btn-primary btn-sm"
                    disabled={selectMode}
                  >
                    Управление
                  </button>
                  <button
                    onClick={(e) => handleButtonClick(e, () => router.push(`/albums/${album.albumId}/public`))}
                    className="btn btn-success btn-sm"
                    disabled={selectMode}
                  >
                    Просмотр
                  </button>
                </div>
              </div>
              
              {!selectMode && (
                <div className="album-card-action">
                  <button
                    onClick={(e) => confirmAndDelete(e, [album.albumId], true)}
                    className="btn btn-danger btn-sm"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        <div 
          className="album-card create-album-card animate-fade-in-up"
          style={{animationDelay: `${albums.length * 0.05}s`} }
          onClick={createNewAlbum}
        >
          <div className="album-card-content">
            <div className="create-album-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="create-album-title">Создать новый альбом</h3>
            <p className="create-album-text">Добавьте новый альбом для ваших фотографий</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;