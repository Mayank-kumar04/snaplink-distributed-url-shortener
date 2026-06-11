import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logoSvg} alt="SnapLink" className="navbar-logo-img" />
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Shorten
          </Link>
          <Link to="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
