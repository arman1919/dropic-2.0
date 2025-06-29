'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../styles/pages/Home.css';
import dropicLogo from '../../public/images/dropic-logo.png';
import demoImage1 from '../../public/images/demo/demo-image-1.jpg';
import demoImage2 from '../../public/images/demo/demo-image-2.jpg';
import demoImage3 from '../../public/images/demo/demo-image-3.jpg';
import demoImage4 from '../../public/images/demo/demo-image-4.jpg';
import demoImage5 from '../../public/images/demo/demo-image-5.jpg';
import demoImage6 from '../../public/images/demo/demo-image-6.jpg';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const demoImages = [
    demoImage1,
    demoImage2,
    demoImage3,
    demoImage4,
    demoImage5,
    demoImage6
  ];

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const updatePage = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevClick = () => {
    const newPage = currentPage > 0 ? currentPage - 1 : demoImages.length - 1;
    updatePage(newPage);
  };

  const handleNextClick = () => {
    const newPage = currentPage < demoImages.length - 1 ? currentPage + 1 : 0;
    updatePage(newPage);
  };

  return (
    <>
      <header className="header">
        <nav className="nav">
          <div className="brand-container">
            <Image src={dropicLogo} alt="Dropic Logo" className="logo-image" width={40} height={40} />
            <span className="brand-text">Dropic</span>
          </div>
          <div className="nav-buttons">
            {isLoggedIn ? (
              <a href="/profile" className="btn btn-outline">Мои альбомы</a>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                className="btn btn-primary"
              >
                Войти
              </button>
            )}
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Создавайте магические фотоальбомы</h1>
          <p>Превратите ваши воспоминания в красивые цифровые альбомы и делитесь ими с друзьями и близкими</p>
          <div className="hero-cta">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/albums/create')}
                className="btn btn-primary btn-hero"
              >
                Создать новый альбом
              </button>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                className="btn btn-primary btn-hero"
              >
                Начать бесплатно
              </button>
            )}
            <a href="#demo" className="btn btn-secondary btn-hero">Посмотреть примеры</a>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Почему выбирают Dropic?</h2>
          <p className="section-subtitle">Мощные инструменты для создания незабываемых фотоальбомов</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Простое создание</h3>
              <p>Загружайте фото одним кликом и создавайте альбомы за считанные минуты</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Красивые темы</h3>
              <p>Выбирайте из множества профессиональных шаблонов и настраивайте под себя</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Совместная работа</h3>
              <p>Приглашайте друзей добавлять фото и создавайте альбомы вместе</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Легкий доступ</h3>
              <p>Делитесь альбомами через ссылку или встраивайте на свой сайт</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <h3>Облачное хранение</h3>
              <p>Ваши фото надежно сохранены и доступны с любого устройства</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Быстрая загрузка</h3>
              <p>Оптимизированные альбомы загружаются мгновенно на любой скорости</p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="demo">
        <div className="album-container">
          <h1 className="section-title">Примеры альбомов</h1>          
          <div className="photo-viewer">
            <div className="photo-container">
              <Image 
                src={demoImages[currentPage]} 
                alt={`Демо изображение ${currentPage + 1}`} 
                className="demo-image"
                layout="fill"
                objectFit="contain"
              />
            </div>
            
            <button className="nav-button nav-prev" onClick={handlePrevClick}>‹</button>
            <button className="nav-button nav-next" onClick={handleNextClick}>›</button>
          </div>

          <div className="pagination">
            {demoImages.map((_, index) => (
              <div
                key={index}
                className={`page-indicator ${index === currentPage ? 'active' : ''}`}
                onClick={() => updatePage(index)}
              />
            ))}
          </div>

          <div className="thumbnails">
            {demoImages.map((image, index) => (
              <div
                key={index}
                className={`thumbnail ${index === currentPage ? 'active' : ''}`}
                onClick={() => updatePage(index)}
              >
                <Image 
                  src={image} 
                  alt={`Миниатюра ${index + 1}`} 
                  className="thumbnail-image"
                  width={80}
                  height={60}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Продукт</h3>
            <a href="#features">Возможности</a>
            <a href="#pricing">Тарифы</a>
            <a href="#demo">Примеры</a>
            <a href="#api">API</a>
          </div>
          <div className="footer-section">
            <h3>Компания</h3>
            <a href="#about">О нас</a>
            <a href="#blog">Блог</a>
            <a href="#careers">Карьера</a>
            <a href="#contact">Контакты</a>
          </div>
          <div className="footer-section">
            <h3>Поддержка</h3>
            <a href="#help">Справка</a>
            <a href="#docs">Документация</a>
            <a href="#community">Сообщество</a>
            <a href="#status">Статус</a>
          </div>
          <div className="footer-section">
            <h3>Правовая информация</h3>
            <a href="#privacy">Конфиденциальность</a>
            <a href="#terms">Условия использования</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dropic. Все права защищены.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;
