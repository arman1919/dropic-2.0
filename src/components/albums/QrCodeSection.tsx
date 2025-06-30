'use client';

import React from 'react';

interface Props {
  publicLink: string;
}

const QrCodeSection: React.FC<Props> = ({ publicLink }) => {
  if (!publicLink) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicLink)}`;
  return (
    <div className="qr-code-section">
      <h4>QR-код</h4>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="QR code" width={180} height={180} />
    </div>
  );
};

export default QrCodeSection;
