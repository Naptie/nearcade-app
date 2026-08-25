import React, { createContext, useContext, useMemo } from 'react';
import { nearcadeApi } from './client';
import { useSettings } from '@/stores/settings';
import { getStoredCookie, useSession } from '@/stores/session';

const ApiContext = createContext<nearcadeApi | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const serverUrl = useSettings((s) => s.serverUrl);
  const setCookieHeader = useSession((s) => s.setCookieHeader);
  const api = useMemo(
    () =>
      new nearcadeApi({
        baseUrl: serverUrl,
        getCookie: () => getStoredCookie(),
        storeCookies: (header) => setCookieHeader(header),
      }),
    [serverUrl, setCookieHeader]
  );
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): nearcadeApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi must be used within ApiProvider');
  return api;
}
