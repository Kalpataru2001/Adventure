import { Injectable } from '@angular/core';

type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeKey = 'app-theme';

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    this.setTheme(savedTheme);
  }

  getSavedTheme(): Theme {
    return (localStorage.getItem(this.themeKey) as Theme) || 'system';
  }

  setTheme(theme: Theme): void {
    localStorage.setItem(this.themeKey, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
  }
}