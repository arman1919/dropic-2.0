'use client';

import React, { useState } from 'react';
import Toast from '../ui/Toast';
import QrCodeSection from './QrCodeSection';

interface Props {
  albumId: string;
}

const PublicLinkSection: React.FC<Props> = ({ albumId }) => {
  const [showToast, setShowToast] = useState(false);

  if (typeof window === 'undefined') return null;

  const publicLink = `${window.location.origin}/albums/${albumId}/public`;

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(publicLink)
      .then(() => setShowToast(true))
      .catch((err) => console.error('Failed to copy link', err));
  };

  return (
    <div className="admin-section" style={{ marginTop: '2rem' }}>
      <div className="public-link-container">
        <h3>Публичная ссылка на альбом:</h3>
        <div className="link-box" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            value={publicLink}
            readOnly
            className="link-input"
            style={{ flex: 1, padding: '0.5rem' }}
          />
          <div className='link-actions-container'>
            <button onClick={() => window.open(publicLink, '_blank')} className="view-button primary-button">
              Посмотреть
            </button>
            <button onClick={copyToClipboard} className="copy-button secondary-button">
              Копировать
            </button>
          </div>

        </div>
            
        <QrCodeSection publicLink={publicLink} />
      </div>
      {showToast && (
        <Toast message="Ссылка скопирована в буфер обмена!" onClose={() => setShowToast(false)} />
      )}
    </div>
  );
};

export default PublicLinkSection;
