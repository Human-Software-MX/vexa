import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { BrowserContext } from 'playwright-core';
import { CDP_COOKIES_FILE } from './browser-profile';

// Persistencia de cookies de sesión (TSK-45 / bug BROWSER-SESSION.md):
// Chromium solo escribe al disco las cookies persistentes (con Expires/Max-Age).
// Los logins de Google/Microsoft usan session cookies que viven en memoria y se
// pierden al cerrar el navegador, así que el sync a S3 nunca las captura.
// Aquí las exportamos con la API de Playwright (context.cookies() devuelve TODAS,
// incluidas las de sesión) a un JSON, y las reimportamos al arrancar.

export async function exportCookieState(context: BrowserContext): Promise<number> {
  try {
    const cookies = await context.cookies();
    mkdirSync(dirname(CDP_COOKIES_FILE), { recursive: true });
    writeFileSync(CDP_COOKIES_FILE, JSON.stringify(cookies), 'utf-8');
    console.log(`[cookie-state] Exportadas ${cookies.length} cookies a ${CDP_COOKIES_FILE}`);
    return cookies.length;
  } catch (err: any) {
    console.log(`[cookie-state] Warning: fallo exportando cookies: ${err.message}`);
    return 0;
  }
}

export async function importCookieState(context: BrowserContext): Promise<number> {
  try {
    if (!existsSync(CDP_COOKIES_FILE)) {
      console.log('[cookie-state] No hay cdp-cookies.json; se omite la importación');
      return 0;
    }
    const raw = readFileSync(CDP_COOKIES_FILE, 'utf-8').trim();
    if (!raw) return 0;

    const cookies = JSON.parse(raw);
    if (!Array.isArray(cookies) || cookies.length === 0) return 0;

    await context.addCookies(cookies);
    console.log(`[cookie-state] Importadas ${cookies.length} cookies desde ${CDP_COOKIES_FILE}`);
    return cookies.length;
  } catch (err: any) {
    console.log(`[cookie-state] Warning: fallo importando cookies: ${err.message}`);
    return 0;
  }
}
