import React, { useState, useEffect } from 'react';

export function getThemePreference() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
    return 'system';
  } catch (e) {
    return 'system';
  }
}

export function getAppTheme() {
  try {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr) return attr;
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

export function setAppTheme(newTheme) {
  try {
    let effective = newTheme;
    if (newTheme === 'system') {
      effective = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      localStorage.setItem('theme', 'system');
    } else {
      localStorage.setItem('theme', newTheme);
    }
    document.documentElement.setAttribute('data-theme', effective);
    window.dispatchEvent(new CustomEvent('campus:theme_change', { detail: effective }));
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

    // Also sync with phone system dark mode in real-time
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e) => {
      const stored = localStorage.getItem('theme');
      if (!stored || stored === 'system') {
        const sysTheme = e.matches ? 'dark' : 'light';
        setTheme(sysTheme);
        document.documentElement.setAttribute('data-theme', sysTheme);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('campus:theme_change', handleThemeChange);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
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
