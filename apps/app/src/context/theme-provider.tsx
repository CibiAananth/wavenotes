import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type ThemeType = 'light' | 'dark';
type ThemeContextType = {
  theme: ThemeType;
  toggleTheme: (newTheme: ThemeType) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => console.warn('no theme provider'),
});

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
}): React.ReactNode => {
  const [theme, setTheme] = useState<ThemeType>('light');

  const toggleTheme = useCallback((newTheme: ThemeType) => {
    setTheme(newTheme);
    window.localStorage.setItem('theme', newTheme);
  }, []);

  useEffect(() => {
    const localTheme = window.localStorage.getItem('theme') as ThemeType;
    localTheme && setTheme(localTheme);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
