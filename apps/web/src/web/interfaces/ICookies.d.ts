export interface ICookies {
  // eslint-disable-next-line @typescript-eslint/ban-types
  on(event: 'changed', listener: any): void;
  get(filter: CookiesFilter): Promise<Cookie[]>;
  getBrowserCookie(name: string): string | undefined;
  remove(url: string, name: string): Promise<void>;
}

export interface CookiesFilter {
  name?: string;
  domain?: string;
}

export interface Cookie {
  domain?: string;
  name: string;
  path?: string;
  secure?: boolean;
  value: string;
}
