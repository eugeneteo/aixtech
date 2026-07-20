import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface Theme {
  id: string;
  label: string;
  description: string;
}

// Registered visual themes. The current design is saved as "apple".
// To add a theme: add an entry here and a matching `[data-theme='<id>']`
// block in index.css. No component changes are required.
export const THEMES: Theme[] = [
  {
    id: 'apple',
    label: 'Apple',
    description: 'Frosted glass over a deep sky gradient.',
  },
  {
    id: 'aurora',
    label: 'Aurora Glass',
    description: 'Refined frosted glass with a vivid aurora glow over deep navy.',
  },
  {
    id: 'cupertino',
    label: 'Cupertino Light',
    description: 'Crisp white cards with soft shadows on an off-white daytime backdrop.',
  },
  {
    id: 'midnight',
    label: 'Midnight Mono',
    description: 'Near-black, high-contrast night mode with flat panels and a cyan accent.',
  },
  {
    id: 'terminal',
    label: 'Terminal Green',
    description: 'Monospace phosphor-green readout on a near-black CRT backdrop.',
  },
  {
    id: 'paper',
    label: 'Paper Almanac',
    description: 'Warm parchment with serif type, sepia ink, and a terracotta accent.',
  },
  {
    id: 'brutal',
    label: 'Neo-Brutalist',
    description: 'Stark high-contrast panels with thick black borders and hard offset shadows.',
  },
  {
    id: 'sunrise',
    label: 'Sunrise Warm',
    description: 'A warm dawn gradient of plum, coral, and amber with an amber accent.',
  },
  {
    id: 'ocean',
    label: 'Ocean Deep',
    description: 'Deep sea gradient of teal and abyssal blue with an aqua accent.',
  },
  {
    id: 'newsprint',
    label: 'Forecast Newsprint',
    description: 'Editorial newspaper look with serif type, ruled dividers, and a restrained ink-red accent.',
  },
  {
    id: 'pastel',
    label: 'Pastel Soft',
    description: 'Gentle pastel gradient with rounded cards, soft shadows, and a calm low-contrast palette.',
  },
  {
    id: 'synthwave',
    label: 'Synthwave Grid',
    description: 'Retro 1980s neon over a deep purple sky with a glowing grid and a hot-magenta accent.',
  },
];

export const DEFAULT_THEME_ID = 'apple';
const STORAGE_KEY = 'weather-starter-theme';

function isKnownTheme(id: string | null): id is string {
  return !!id && THEMES.some((theme) => theme.id === id);
}

function readInitialTheme(): string {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isKnownTheme(saved)) return saved;
  } catch {
    // localStorage may be unavailable; fall back to the default.
  }
  return DEFAULT_THEME_ID;
}

interface ThemeContextValue {
  theme: string;
  themes: Theme[];
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore persistence failures (for example private browsing).
    }
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    if (isKnownTheme(id)) setThemeState(id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themes: THEMES, setTheme }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
