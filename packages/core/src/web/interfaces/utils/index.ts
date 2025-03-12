export type Prettify<T> = T & {};
// the other is optional
export type OneOf<T1 extends Record<string, any>, T2 extends Record<string, any>> =
  | Prettify<Partial<T1> & T2>
  | Prettify<Partial<T2> & T1>;
// the other is required
