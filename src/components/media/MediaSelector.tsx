'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api/client';
import '../../styles/components/MediaSelector.css';
import { Upload, X } from 'lucide-react';

interface Photo {
  photoId: string;
  url: string;
  filename: string;
  originalName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (photos: Photo[]) => void;
}

const MediaSelector: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const router = useRouter();
  const [media, setMedia] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Photo[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/media', { headers });
      const normalized = (res.data.media || []).map((m: any) => {
        if (m.photoId) return m;
        if (m.publicId) return { ...m, photoId: m.publicId };
        // fallback: derive from filename before last slash
                let idFromFilename: string | undefined;
        if (m.filename) {
          // remove file extension but keep folder structure if present
          const noExt = m.filename.replace(/\.[^/.]+$/, '');
          idFromFilename = noExt;
        }
        return { ...m, photoId: idFromFilename || '' };
      });
      setMedia(normalized);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (item: Photo) => {
    setSelected((prev) => {
      if (prev.find((p) => p.photoId === item.photoId)) {
        return prev.filter((p) => p.photoId !== item.photoId);
      }
      return [...prev, item];
    });
  };

  const confirm = () => {
    onSelect(selected);
    setSelected([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="media-selector-overlay">
      <div className="media-selector-modal">
        <div className="media-selector-header">
          <h2>Select images</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-message">Loading media files...</div>
        ) : (
          <>
            {media.length === 0 ? (
              <div className="no-media-container">
                <div className="no-media-message">No images</div>
                <p className="no-media-description">
                  First upload photos to the media library
                </p>
                <button 
                  className="go-to-media-button"
                  onClick={() => {
                    onClose();
                    router.push('/media');
                  }}
                >
                  <Upload size={18} />
                  Go to upload
                </button>
              </div>
            ) : (
              <div className="media-selector-grid">
                {media.map((item) => (
                  <div
                    key={item.photoId}
                    className={`media-selector-item ${
                      selected.find((s) => s.photoId === item.photoId) ? 'selected' : ''
                    }`}
                    onClick={() => toggle(item)}
                  >
                    <img src={item.url} alt={item.originalName || item.filename} />
                  </div>
                ))}
              </div>
            )}

            <div className="media-selector-footer">
              <button className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button
                className="confirm-button"
                onClick={confirm}
                disabled={selected.length === 0}
              >
                Add selected ({selected.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaSelector;
