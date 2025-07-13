'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './PublicAlbum.module.css';
import { CldImage } from 'next-cloudinary';

const SERVER_BASE_URL = 'http://localhost:5000';

export default function PublicAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = Array.isArray(params?.albumId) ? params.albumId[0] : (params?.albumId as string);

  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<string | null>(null);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [autoNextDelay, setAutoNextDelay] = useState(5);
  const autoNextTimerRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<any>(null);

  const minSwipeDistance = 50;

  // Переключение на предыдущее изображение
  const prevImage = useCallback(() => {
    if (images.length === 0 || isAnimating) return;
    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    setNextIndex(newIndex);
    setSlideDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentImageIndex(newIndex);
      setIsAnimating(false);
    }, 600);
  }, [images.length, currentImageIndex, isAnimating]);

  // Переключение на следующее изображение
  const nextImage = useCallback(() => {
    if (images.length === 0 || isAnimating) return;
    const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
    setNextIndex(newIndex);
    setSlideDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentImageIndex(newIndex);
      setIsAnimating(false);
    }, 600);
  }, [images.length, currentImageIndex, isAnimating]);

  // Обработчик нажатия клавиш
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      prevImage();
    } else if (event.key === 'ArrowRight') {
      nextImage();
    }
  }, [prevImage, nextImage]);

  // Полноэкранный режим
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (imageRef.current && imageRef.current.requestFullscreen) {
        imageRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Переход к редактированию альбома
  const handleEditAlbum = () => {
    router.push(`/admin/${albumId}`);
  };

  // Переход к конкретному изображению
  const goToImage = (index: number) => {
    if (index === currentImageIndex || isAnimating) return;
    setNextIndex(index);
    setSlideDirection(index > currentImageIndex ? 'left' : 'right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setIsAnimating(false);
    }, 600);
  };

  // Навешиваем обработчик клавиш
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Проверка владельца альбома
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
          setIsOwner(false);
          return;
        }
        const deleteToken = localStorage.getItem(`album_token_${albumId}`);
        if (deleteToken) {
          setIsOwner(true);
          return;
        }
        try {
          const res = await fetch(`/api/albums/${albumId}/check-ownership`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          const data = await res.json();
          setIsOwner(data.isOwner);
        } catch {
          setIsOwner(false);
        }
      } catch {
        setIsOwner(false);
      }
    };
    if (albumId) checkOwnership();
  }, [albumId]);

  // Загрузка данных альбома
  useEffect(() => {
    const fetchAlbumImages = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/albums/${albumId}/public`);
        const data = await res.json();
        const processedImages = (data.images || []).map((image: any) => ({
          ...image,
          description_hidden: image.description_hidden === true,
          date_hidden: image.date_hidden === true,
          description: image.description || '',
          date: image.date || null,
          url: image.url || image
        }));
        setImages(processedImages);
        if (data.albumTitle) setAlbumTitle(data.albumTitle);
        if (data.description) setAlbumDescription(data.description);
        if (data.options) {
          setAutoNext(data.options.autoNext || false);
          setAutoNextDelay(data.options.autoNextDelay || 5);
        }
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить альбом. Пожалуйста, попробуйте позже.');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };
    if (albumId) fetchAlbumImages();
  }, [albumId]);

  // Обработчик изменения состояния полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Сброс анимации
  useEffect(() => {
    if (!isAnimating) {
      setSlideDirection(null);
      setNextIndex(null);
    }
  }, [isAnimating]);

  // Автоматическое переключение изображений
  useEffect(() => {
    if (autoNext && images.length > 1 && !isAnimating && !isPaused) {
      setProgress(0);
      const step = 100 / (autoNextDelay * 10);
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressIntervalRef.current);
            return 0;
          }
          return prev + step;
        });
      }, 100);
      autoNextTimerRef.current = setTimeout(() => {
        nextImage();
      }, autoNextDelay * 1000);
    }
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [autoNext, autoNextDelay, currentImageIndex, images.length, isAnimating, nextImage, isPaused]);

  // Очищаем таймеры при размонтировании
  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Свайпы
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // --- Рендер ---
  if (loading) {
    return (
      <div className={styles.albumContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка альбома...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.albumContainer}>
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }
  if (!images || images.length === 0) {
    return (
      <div className={styles.albumContainer}>
        <h2>{albumTitle}</h2>
        <div className={styles.emptyAlbumMessage}>
          <p>В этом альбоме пока нет фотографий.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.albumBody}>
      <div className={styles.albumContainer}>
        <div className={styles.albumHeader}>
          <h2>{albumTitle}</h2>
          {isOwner && (
            <button onClick={handleEditAlbum} className={styles.editButton}>
              Редактировать
            </button>
          )}
        </div>
        {images.length > 0 && (
          <div className={styles.slideshowContainer}>
            <div
              className={styles.currentImageContainer}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Текущее изображение */}
              <div className={`${styles.imageWrapper} ${
                slideDirection === 'left' ? styles.moveToLeft :
                slideDirection === 'right' ? styles.moveToRight : ''
              }`}>
                <CldImage
                  ref={imageRef}
                  src={images[currentImageIndex].photoId}
                  alt={`Фото ${currentImageIndex + 1}`}
                  className={styles.currentImage}
                  onLoad={handleImageLoad}
                  width="1200"
                  height="800"
                  crop="fill"
                  gravity="auto"
                />
                {/* Информация о фото */}
                {images[currentImageIndex] && (() => {
                  const img = images[currentImageIndex];
                  const showDescription = img.description && img.description !== '' && !img.description_hidden;
                  const showDate = img.date && !img.date_hidden;
                  if (!showDescription && !showDate) return null;
                  return (
                    <div className={styles.photoInfo}>
                      {showDescription && (
                        <div className={styles.photoDescription}>{img.description}</div>
                      )}
                      {showDate && (
                        <div className={styles.photoDate}>{formatDate(img.date)}</div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {/* Следующее изображение */}
              {slideDirection && nextIndex !== null && (
                <div className={`${styles.imageWrapper} ${
                  slideDirection === 'left' ? styles.moveFromRight :
                  slideDirection === 'right' ? styles.moveFromLeft : ''
                }`}>
                  <CldImage
                    src={images[nextIndex].photoId}
                    alt={`Фото ${nextIndex + 1}`}
                    className={styles.currentImage}
                    width="1200"
                    height="800"
                    crop="fill"
                    gravity="auto"
                  />
                  {images[nextIndex] && (
                    <div className={styles.photoInfo}>
                      {!images[nextIndex].description_hidden && images[nextIndex].description && (
                        <div className={styles.photoDescription}>{images[nextIndex].description}</div>
                      )}
                      {!images[nextIndex].date_hidden && images[nextIndex].date && (
                        <div className={styles.photoDate}>{formatDate(images[nextIndex].date)}</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Навигационные стрелки */}
              <button
                className={`${styles.navArrow} ${styles.prevArrow}`}
                onClick={prevImage}
                aria-label="Предыдущее фото"
                disabled={isAnimating}
              >
                &#10094;
              </button>
              <button
                className={`${styles.navArrow} ${styles.nextArrow}`}
                onClick={nextImage}
                aria-label="Следующее фото"
                disabled={isAnimating}
              >
                &#10095;
              </button>
              {/* Кнопка полноэкранного режима */}
              <button
                className={styles.fullscreenButton}
                onClick={toggleFullscreen}
                aria-label="Полноэкранный режим"
              >
                {isFullscreen ? '⤓' : '⤢'}
              </button>
            </div>
            <div className={styles.imageNumber}>{currentImageIndex + 1} / {images.length}</div>
            {/* Индикатор прогресса и кнопка паузы */}
            {autoNext && (
              <div className={styles.autoNextControls}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button
                  className={styles.pauseButton}
                  onClick={() => setIsPaused(!isPaused)}
                  aria-label={isPaused ? "Продолжить" : "Пауза"}
                >
                  <span>{isPaused ? '▶' : '⏸'}</span>
                </button>
              </div>
            )}
            {/* Индикаторы-точки */}
            {images.length > 1 && (
              <div className={styles.dotsContainer}>
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ''}`}
                    onClick={() => goToImage(index)}
                    aria-label={`Перейти к фото ${index + 1}`}
                  />
                ))}
              </div>
            )}
            {/* Миниатюры */}
            {images.length > 1 && (
              <div className={styles.thumbnailsContainer}>
                {images.map((image, index) => {
                  const thumbUrl = (image.url || image).startsWith('http')
                    ? (image.url || image)
                    : `${SERVER_BASE_URL}${image.url || image}`;
                  return (
                    <CldImage
                      key={index}
                      src={image.photoId}
                      alt={`Миниатюра ${index + 1}`}
                      className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''}`}
                      onClick={() => goToImage(index)}
                      width="100"
                      height="60"
                      crop="fill"
                      gravity="auto"
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Описание альбома */}
        {albumDescription && (
          <div className={styles.albumDescription}>
            <p>{albumDescription}</p>
          </div>
        )}
        {images.length === 0 && !loading && !error && (
          <div className={styles.emptyAlbumMessage}>
            <p>В этом альбоме пока нет фотографий.</p>
          </div>
        )}
      </div>
    </div>
  );
}