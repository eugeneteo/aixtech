import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme/theme';
import { CheckIcon, ChevronDownIcon, PaletteIcon } from './icons';

export function ThemeSelector() {
  const { theme, themes, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const active = themes.find((t) => t.id === theme) ?? themes[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select theme"
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-xl hover:bg-white/[0.14]"
      >
        <PaletteIcon className="h-3.5 w-3.5" />
        <span>{active?.label ?? 'Theme'}</span>
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/85 p-1 shadow-xl backdrop-blur-xl"
        >
          {themes.map((option) => {
            const isActive = option.id === theme;
            return (
              <li key={option.id} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left hover:bg-white/[0.1] ${
                    isActive ? 'bg-white/[0.08]' : ''
                  }`}
                >
                  <span className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/90">
                    {isActive ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-white">{option.label}</span>
                    <span className="text-xs text-white/60">{option.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
