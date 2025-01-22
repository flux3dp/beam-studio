export interface ICookies {
  get(filter: CookiesFilter): Promise<Cookie[]>;
  getBrowserCookie(name: string): string | undefined;
  on(event: 'changed', listener: any): void;
  remove(url: string, name: string): Promise<void>;
}

export interface CookiesFilter {
  domain?: string;
  name?: string;
}

export interface Cookie {
  domain?: string;
  name: string;
  path?: string;
  secure?: boolean;
  value: string;
}
