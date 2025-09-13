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
        console.error('Error loading albums:', err);
        const axiosError = err as AxiosError;
        if (axiosError.response?.status === 401) {
          localStorage.removeItem('userToken');
          router.push('/auth');
        } else {
          setError('Failed to load your albums. Please try refreshing the page.');
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
            throw new Error(`Delete token for album ${albumId} not found.`);
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
      console.error('Error deleting albums:', err);
      const errorMessage = err instanceof Error ? err.message : 'Make sure you have permission for this action.';
      setError(`Failed to delete selected albums. ${errorMessage}`);
    }
  };
  
  const confirmAndDelete = (e: MouseEvent<HTMLButtonElement> | null, albumIds: string[], single: boolean) => {
    if (e) e.stopPropagation();

    if (albumIds.length === 0) return;

    const message = single
      ? 'Are you sure you want to delete this album?'
      : `Are you sure you want to delete ${albumIds.length} selected albums?`;

    confirmAlert({
      title: 'Delete confirmation',
      message,
      buttons: [
        {
          label: 'Yes, delete',
          onClick: () => handleDelete(albumIds)
        },
        {
          label: 'Cancel'
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
        <p className="loading-text">Loading albums...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" suppressHydrationWarning={true}>
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Try again</button>
      </div>
    );
  }

  return (
    <div className="content-container" suppressHydrationWarning={true}>
      <div className="content-header">
        <h1 className="page-title">My Albums</h1>
        
        <div className="btn-group">
          <button
            onClick={toggleSelectMode}
            className={`btn ${selectMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {selectMode ? 'Finish selection' : 'Select albums'}
          </button>
          
          {selectMode && (
            <>
              <button
                onClick={selectAllAlbums}
                className="btn btn-secondary"
              >
                {selectedAlbums.length === albums.length ? 'Deselect all' : 'Select all'}
              </button>
              
              <button
                onClick={() => confirmAndDelete(null, selectedAlbums, false)}
                disabled={selectedAlbums.length === 0}
                className="btn btn-danger"
              >
                Delete selected ({selectedAlbums.length})
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
                  {album.photoCount} photos
                </div>
              )}
              
              <div className="album-card-header">
                <h2 className="album-card-title">{album.title || 'Untitled'}</h2>
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
                    Manage
                  </button>
                  <button
                    onClick={(e) => handleButtonClick(e, () => router.push(`/albums/${album.albumId}/public`))}
                    className="btn btn-success btn-sm"
                    disabled={selectMode}
                  >
                    View
                  </button>
                </div>
              </div>
              
              {!selectMode && (
                <div className="album-card-action">
                  <button
                    onClick={(e) => confirmAndDelete(e, [album.albumId], true)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
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
            <h3 className="create-album-title">Create a new album</h3>
            <p className="create-album-text">Add a new album for your photos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;