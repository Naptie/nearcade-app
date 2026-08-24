import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Session cookie jar.
 *
 * nearcade uses Better Auth session cookies. On native there is no automatic
 * cookie store for fetch, so we capture Set-Cookie from responses (notably the
 * one-time-token login) and replay them via the `Cookie` header. The jar is
 * persisted in SecureStore on native and AsyncStorage (localStorage) on web.
 */

const COOKIE_KEY = 'nearcade.session_cookie';

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function delItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

interface SessionState {
  cookie: string | undefined;
  hydrated: boolean;
  setCookieHeader: (setCookieHeader: string | null) => void;
  logout: () => void;
  markHydrated: () => void;
}

function mergeSetCookie(jar: string | undefined, setCookieHeader: string): string {
  // set-cookie may contain multiple comma-separated cookies. Parse name=value
  // pairs and merge into the jar, dropping attributes like Path/HttpOnly.
  const parts = splitSetCookieHeader(setCookieHeader);
  const map = new Map<string, string>();
  if (jar) {
    for (const pair of jar.split('; ')) {
      const idx = pair.indexOf('=');
      if (idx > 0) map.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
  }
  for (const part of parts) {
    const [pair] = part.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (name && value) map.set(name, value);
    }
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function splitSetCookieHeader(header: string): string[] {
  // Split on commas that are not inside a date/expires value.
  const out: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < header.length; i++) {
    const ch = header[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      // Heuristic: a comma followed by "name=" starts a new cookie.
      const rest = header.slice(i + 1);
      if (/^\s*[\w.-]+\s*=/.test(rest) && !/^\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d)/i.test(rest)) {
        out.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      cookie: undefined,
      hydrated: false,
      setCookieHeader: (header) => {
        if (!header) return;
        set((s) => ({ cookie: mergeSetCookie(s.cookie, header) }));
      },
      logout: () => {
        void delItem(COOKIE_KEY);
        set({ cookie: undefined });
      },
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: COOKIE_KEY,
      storage: createJSONStorage(() => ({
        getItem: async (key) => {
          const value = await getItem(key);
          return value ? value : null;
        },
        setItem: async (key, value) => {
          await setItem(key, value);
        },
        removeItem: async (key) => {
          await delItem(key);
        },
      })),
      partialize: (state) => ({ cookie: state.cookie }) as unknown as SessionState,
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

export function getStoredCookie(): string | undefined {
  return useSession.getState().cookie;
}
