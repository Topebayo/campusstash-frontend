import React, { useState, useEffect } from 'react';

export function getAppTheme() {
  try {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
  } catch (e) {
    return 'light';
  }
}

export function setAppTheme(newTheme) {
  try {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('campus:theme_change', { detail: newTheme }));
  } catch (e) {}
}

export function toggleAppTheme() {
  const current = getAppTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setAppTheme(next);
  return next;
}

function ThemeToggleBtn({ style = {}, className = '' }) {
  const [theme, setTheme] = useState(() => getAppTheme());

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail) {
        setTheme(e.detail);
      } else {
        setTheme(getAppTheme());
      }
    };
    window.addEventListener('campus:theme_change', handleThemeChange);
    return () => window.removeEventListener('campus:theme_change', handleThemeChange);
  }, []);

  const handleToggle = () => {
    toggleAppTheme();
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`aesthetic-theme-toggle-btn ${className}`}
      style={style}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme mode"
    >
      <i className={isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
    </button>
  );
}

export default ThemeToggleBtn;

