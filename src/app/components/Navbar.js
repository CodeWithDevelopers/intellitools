'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MenuOutlined, CloseOutlined, UserOutlined, LogoutOutlined, DownOutlined
} from '@ant-design/icons';
import { Avatar, Dropdown, Menu } from 'antd';
import { useUser } from '../context/UserContext';
import styles from './Navbar.module.css';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useUser();

  const navLinks = [
    { href: '/', label: 'Home' },
    {
      label: 'AI Tools',
      dropdown: [
        { href: '/text', label: 'Text Summarizer' },
        { href: '/word', label: 'Word Summarizer' },
        // { href: '/pdf', label: 'PDF Summarizer' },
        { href: '/youtube', label: 'YouTube Summarizer' },
      ],
    },
    { href: '#contact', label: 'Contact Us' },
    { href: '#faqs', label: 'FAQs' },
  ];

  const profileMenuItems = [
    {
      key: 'profile',
      label: <Link href="/profile">Profile</Link>,
      icon: <UserOutlined />
    },
    {
      key: 'logout',
      label: <span onClick={logout}>Logout</span>,
      icon: <LogoutOutlined />
    }
  ];

  const isActive = (path) => pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const getAvatarUrl = () => {
    if (user?.avatar) {
      return `/api/profile/avatar/${user.id}?${new Date().getTime()}`;
    }
    return null;
  };

  const toolsMenu = (
    <Menu>
      {navLinks.find(l => l.label === 'AI Tools').dropdown.map(item => (
        <Menu.Item key={item.href}>
          <Link href={item.href}>{item.label}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image src="/assets/Logo.svg" alt="Logo" width={52} height={52} />
        </Link>

        <div className={styles.centerNav}>
          {navLinks.map((link) =>
            link.dropdown ? (
              <Dropdown key={link.label} overlay={toolsMenu} trigger={['hover']}>
                <span className={styles.link}>
                  {link.label} <DownOutlined style={{ fontSize: '10px' }} />
                </span>
              </Dropdown>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${isActive(link.href) ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        <div className={styles.rightSection}>
          {user ? (
            <Dropdown
              menu={{ items: profileMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className={styles.profileAvatar}>
                <Avatar
                  size="medium"
                  src={getAvatarUrl()}
                  icon={!user.avatar && <UserOutlined />}
                >
                  {!user.avatar && user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </div>
            </Dropdown>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login" className={styles.loginButton}>Login</Link>
              <Link href="/signup" className={styles.signupButton}>Signup</Link>
            </div>
          )}
        </div>

        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`}>
        {navLinks.map((link) =>
          link.dropdown ? (
            <div key={link.label} className={styles.mobileDropdown}>
              <span className={styles.mobileLink}>{link.label}</span>
              <div className={styles.mobileSubmenu}>
                {link.dropdown.map((sublink) => (
                  <Link
                    key={sublink.href}
                    href={sublink.href}
                    className={styles.mobileSublink}
                    onClick={() => setIsOpen(false)}
                  >
                    {sublink.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${isActive(link.href) ? styles.active : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          )
        )}
        {user ? (
          <div className={styles.mobileProfileMenu}>
            <Link href="/profile" className={styles.mobileLink} onClick={() => setIsOpen(false)}>
              Profile
            </Link>
            <button className={styles.mobileLink} onClick={() => { logout(); setIsOpen(false); }}>
              Logout
            </button>
          </div>
        ) : (
          <div className={styles.authButtons}>
            <Link href="/login" className={styles.loginButton}>Login</Link>
            <Link href="/signup" className={styles.signupButton}>Signup</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
