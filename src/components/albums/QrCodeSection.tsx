'use client';

import React from 'react';
import { Download } from 'lucide-react';

interface Props {
  publicLink: string;
}

const QrCodeSection: React.FC<Props> = ({ publicLink }) => {
  if (!publicLink) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicLink)}`;
  
  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-code.png';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Free up memory
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  return (
    <div className="qr-code-section">
      <h4>QR code</h4>
      <div className="qr-code-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="QR code" width={180} height={180} />
        <button className="download-qr-button" onClick={downloadQR}>
          <Download size={16} />
          Download QR code
        </button>
      </div>
    </div>
  );
};

export default QrCodeSection;
