import { session } from '@electron/remote';

import type { Cookie, CookiesFilter, ICookies } from '@core/interfaces/ICookies';

const { cookies } = session.defaultSession;

window.addEventListener('beforeunload', () => {
  cookies.removeAllListeners();
});

export default {
  get(filter: CookiesFilter): Promise<Cookie[]> {
    return cookies.get(filter);
  },
  on(event: 'changed', listener: any): void {
    cookies.on(event, listener);
  },
  remove(url: string, name: string): Promise<void> {
    return cookies.remove(url, name);
  },
} as ICookies;
