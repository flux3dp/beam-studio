import Cookies from 'js-cookie';

import type { ICookies } from '@core/interfaces/ICookies';

export default {
  getBrowserCookie: (name: string) => Cookies.get(name),
} as ICookies;
