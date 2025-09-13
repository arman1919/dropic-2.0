'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../styles/pages/Home.css';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const demoImages = [
    '/images/demo/demo-image-1.jpg',
    '/images/demo/demo-image-2.jpg',
    '/images/demo/demo-image-3.jpg',
    '/images/demo/demo-image-4.jpg',
    '/images/demo/demo-image-5.jpg',
    '/images/demo/demo-image-6.jpg'
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
            <Image src="/images/dropic-logo.png" alt="Dropic Logo" className="logo-image" width={40} height={40} />
            <span className="brand-text">Dropic</span>
          </div>
          <div className="nav-buttons">
            {isLoggedIn ? (
              <a href="/profile" className="btn btn-outline">My albums</a>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                className="btn btn-primary"
              >
                Log in
              </button>
            )}
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h1>Create magical photo albums</h1>
          <p>Turn your memories into beautiful digital albums and share them with friends and family</p>
          <div className="hero-cta">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/albums/create')}
                className="btn btn-primary btn-hero"
              >
                Create new album
              </button>
            ) : (
              <button
                onClick={() => router.push('/auth')}
                className="btn btn-primary btn-hero"
              >
                Get started free
              </button>
            )}
            <a href="#demo" className="btn btn-secondary btn-hero">See examples</a>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why choose Dropic?</h2>
          <p className="section-subtitle">Powerful tools to create unforgettable photo albums</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Easy creation</h3>
              <p>Upload photos in one click and make albums in minutes</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Beautiful themes</h3>
              <p>Choose from many professional templates and customize them</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Collaboration</h3>
              <p>Invite friends to add photos and build albums together</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Easy access</h3>
              <p>Share albums via link or embed them on your website</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <h3>Cloud storage</h3>
              <p>Your photos are safely stored and accessible from any device</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast loading</h3>
              <p>Optimized albums load instantly at any speed</p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="demo">
        <div className="album-container">
          <h1 className="section-title">Album examples</h1>          
          <div className="photo-viewer">
            <div className="photo-container">
              <Image 
                src={demoImages[currentPage]} 
                alt={`Demo image ${currentPage + 1}`} 
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
                  alt={`Thumbnail ${index + 1}`} 
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
            <h3>Product</h3>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Examples</a>
            <a href="#api">API</a>
          </div>
          <div className="footer-section">
            <h3>Company</h3>
            <a href="#about">About</a>
            <a href="#blog">Blog</a>
            <a href="#careers">Careers</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-section">
            <h3>Support</h3>
            <a href="#help">Help</a>
            <a href="#docs">Documentation</a>
            <a href="#community">Community</a>
            <a href="#status">Status</a>
          </div>
          <div className="footer-section">
            <h3>Legal</h3>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms of use</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dropic. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;
