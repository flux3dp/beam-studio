interface Font {
  family: string;
  italic: boolean;
  postscriptName: string;
  style: string;
  weight: number;
}

declare module 'font-scanner' {
  export function getAvailableFontsSync(): Font[];
  export function findFontSync(arg: Font): Font;
  export function substituteFontSync(postscriptName: string, text: string): Font;

  export default {
    findFontSync,
    getAvailableFontsSync,
    substituteFontSync,
  };
}
