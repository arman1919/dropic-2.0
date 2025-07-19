'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { Plus, User, Image as ImageIcon, LogOut } from 'lucide-react';
import '../../styles/components/NavBar.css';
import dropicLogo from '../../..//public/images/dropic-logo.png';

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const createNewAlbum = () => {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      router.push('/auth');
      return;
    }
    router.push('/albums/create');
  };

  const handleLogout = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('album_delete_token_') || key === 'userToken' || key === 'username') {
        localStorage.removeItem(key);
      }
    });
    
    router.push('/auth');
    // Можно добавить вызов API для инвалидации токена на сервере
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <Image src={dropicLogo} alt="Dropic Logo" className="navbar-logo" width={40} height={40} />
          <span className="brand-text">Dropic</span>
        </Link>

        {/* Burger icon */}
        <button className={`burger ${menuOpen ? 'open' : ''}`} onClick={toggleMenu} aria-label="menu">
          <span className="burger-line" />
          <span className="burger-line" />
          <span className="burger-line" />
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <button onClick={createNewAlbum} className="navbar-button">
            <Plus size={18} />
            Создать новый альбом
          </button>
          <Link href="/profile" className={`navbar-button ${pathname === '/profile' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <User size={18} />
            Мои альбомы
          </Link>
          <Link href="/media" className={`navbar-button ${pathname === '/media' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
            <ImageIcon size={18} />
            Медиа библиотека
          </Link>
          <button onClick={handleLogout} className="navbar-button">
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
