import { ICookies } from 'core-interfaces/ICookies';
import Cookies from 'js-cookie';

export default {
  getBrowserCookie: (name: string) => {
    const value = Cookies.get(name);
    return value;
  },
} as ICookies;
