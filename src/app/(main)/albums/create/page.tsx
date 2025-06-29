'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api/client';
import '../../../../styles/pages/Create.css';

const CreateAlbumPage = () => {
  const [albumName, setAlbumName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/albums', { name: albumName });

      if (response.data.albumId) {
        const albumId = response.data.albumId;
        
        if (response.data.deleteToken) {
          localStorage.setItem(`album_token_${albumId}`, response.data.deleteToken);
        }
        
        localStorage.setItem(`album_name_${albumId}`, albumName);
        localStorage.setItem('newAlbumCreated', albumId);
        
        router.push(`/albums/${albumId}`);
      } else {
        setError('Ошибка при создании альбома: не получен ID альбома');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите в систему заново');
        // router.push('/auth');
      } else {
        setError(err.response?.data?.message || 'Не удалось создать альбом');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="page-header">
        <h1>Создание нового альбома</h1>
      </div>

      {error && (
        <div className="notification error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="albumName">
            Название альбома
          </label>
          <input
            id="albumName"
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            className="form-input"
            placeholder="Введите название альбома"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <button
            type="submit"
            className="primary-button w-full"
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать альбом'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="secondary-button"
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAlbumPage;
