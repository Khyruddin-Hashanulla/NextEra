import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { mockMatchMedia, spyOnMatchMedia } from '@/test/utils';

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('defaults to system mode and light theme when no preference is stored', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('system');
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('reads a stored dark mode', () => {
    localStorage.setItem('theme-mode', 'dark');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('dark');
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('follows system preference for the resolved theme', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('system');
    expect(result.current.theme).toBe('dark');
  });

  it('updates the theme when the system preference changes while in system mode', () => {
    const { emit } = spyOnMatchMedia();
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('light');

    act(() => emit('(prefers-color-scheme: dark)', true));
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setMode switches the mode and theme', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setMode('dark'));
    expect(result.current.mode).toBe('dark');
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme-mode')).toBe('dark');
  });

  it('toggleTheme cycles light -> dark -> system -> light', () => {
    localStorage.setItem('theme-mode', 'light');
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('system');

    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('light');
  });
});
