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
      const response = await api.post('/api/albums', { title: albumName });

      if (response.data.albumId) {
        const albumId = response.data.albumId;
        
        if (response.data.deleteToken) {
          localStorage.setItem(`album_token_${albumId}`, response.data.deleteToken);
        }
        
        localStorage.setItem(`album_name_${albumId}`, albumName);
        localStorage.setItem('newAlbumCreated', albumId);
        
        router.push(`/albums/${albumId}`);
      } else {
        setError('Error creating album: album ID not received');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Authorization error. Please log in again');
        // router.push('/auth');
      } else {
        setError(err.response?.data?.message || 'Failed to create album');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="page-header">
        <h1>Create a new album</h1>
      </div>

      {error && (
        <div className="notification error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="albumName">
            Album title
          </label>
          <input
            id="albumName"
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            className="form-input"
            placeholder="Enter album title"
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
            {loading ? 'Creating...' : 'Create album'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="secondary-button"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAlbumPage;
