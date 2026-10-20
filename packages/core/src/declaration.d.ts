declare module '*.scss' {
  const content: Record<string, string>;

  export default content;
}
declare module '*.svg';
declare module '*.svg?url';
declare module '*.svg?raw' {
  const content: string;

  export default content;
}
