export const memoize = <T extends (arg: any) => any>(fn: T): T => {
  const cache: Record<string, ReturnType<T>> = {};

  return ((...args: Parameters<T>): ReturnType<T> => {
    const n = args[0];

    if (n in cache) return cache[n];

    const result = fn(n);

    cache[n] = result;

    return result;
  }) as T;
};
