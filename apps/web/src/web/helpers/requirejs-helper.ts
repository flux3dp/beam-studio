/* eslint-disable @typescript-eslint/no-explicit-any */
export default async (moduleName: string): Promise<any> => {
  const { requirejs } = window;
  const module = await new Promise<any>((resolve) => {
    requirejs([moduleName], (m) => {
      resolve(m);
    });
  });
  return module;
};
