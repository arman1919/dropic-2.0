import api from '../../../../lib/api/client';

// Функция для корректного формирования URL изображения
export const getImageUrl = (image, albumId) => {
  if (!image) return 'https://via.placeholder.com/400x300?text=Нет+изображения';
  
  // Базовый URL сервера
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  // Если image - это строка (URL или путь)
  if (typeof image === 'string') {
    return image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;
  }
  
  // Если image - это объект с полем url
  if (image.url) {
    const url = image.url;
    return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }
  
  // Если есть поле path
  if (image.path) {
    const path = image.path;
    return path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // Если есть только filename
  if (image.filename) {
    return `${baseUrl}/server/uploads/${albumId}/${image.filename}`;
  }
  
  // Если ничего не подошло
  console.log('Неизвестный формат изображения:', image);
  return 'https://via.placeholder.com/400x300?text=Неизвестный+формат';
};

// Функция для генерации QR-кода
export const generateQrCode = async (link) => {
  try {
    const response = await api.get(`/api/qr/generate?link=${encodeURIComponent(link)}`);
    return response.data.qrImage;
  } catch (err) {
    console.error('Ошибка при генерации QR-кода:', err);
    throw new Error('Не удалось сгенерировать QR-код');
  }
};

// Функция для скачивания QR-кода
export const downloadQrCode = (qrCode, albumId) => {
  if (!qrCode) return;
  
  const link = document.createElement('a');
  link.href = qrCode;
  link.download = `qr-code-${albumId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
