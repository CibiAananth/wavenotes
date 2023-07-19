import { useEffect, useState } from 'react';

const useTheme = () => {
  const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

  const getCurrentTheme = () => darkThemeMq.matches;
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());

  const mqListener = (e: MediaQueryListEvent) => {
    setIsDarkTheme(e.matches);
  };

  useEffect(() => {
    darkThemeMq.addEventListener('change', mqListener);
    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, [darkThemeMq]);
  return isDarkTheme;
};

export default useTheme;
