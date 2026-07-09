import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

export const BROWSER_DATA_DIR = '/tmp/browser-data';

export const AUTH_ESSENTIAL_FILES = [
  'Local State',
  'Default/Cookies',
  'Default/Cookies-journal',
  'Default/Preferences',
  'Default/Secure Preferences',
  'Default/Login Data',
  'Default/Login Data-journal',
  'Default/Login Data For Account',
  'Default/Login Data For Account-journal',
  'Default/Network Persistent State',
  'Default/Web Data',
  // Session cookies (sin Expires/Max-Age) viven solo en memoria y Chromium no
  // las escribe al archivo Cookies. Se exportan vía CDP a este JSON antes de
  // cada guardado y se reimportan al arrancar, para que el login de Google
  // (que usa session cookies) sobreviva entre contenedores. Ver cookie-state.ts.
  'Default/cdp-cookies.json',
];

// Ruta del JSON con el volcado completo de cookies (incluye session cookies).
export const CDP_COOKIES_FILE = join(BROWSER_DATA_DIR, 'Default', 'cdp-cookies.json');

export const AUTH_ESSENTIAL_DIRS = [
  'Default/Local Storage',
  'Default/Session Storage',
];

export function cleanStaleLocks(dir: string = BROWSER_DATA_DIR): void {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  for (const f of lockFiles) {
    const p = join(dir, f);
    if (existsSync(p)) {
      try { unlinkSync(p); } catch {}
      console.log(`[browser-profile] Removed stale lock: ${f}`);
    }
  }
}

export function ensureBrowserDataDir(): void {
  mkdirSync(BROWSER_DATA_DIR, { recursive: true });
}
