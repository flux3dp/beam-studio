/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/ban-types */
import { session } from '@electron/remote';

import { Cookie, CookiesFilter, ICookies } from 'interfaces/ICookies';

const { cookies } = session.defaultSession;
export default {
  on(event: 'changed', listener: any): void {
    cookies.on(event, listener);
  },
  get(filter: CookiesFilter): Promise<Cookie[]> {
    return cookies.get(filter);
  },
  remove(url: string, name: string): Promise<void> {
    return cookies.remove(url, name);
  },
} as ICookies;
