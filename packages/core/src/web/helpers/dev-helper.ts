export const mockT = (val: string) => val;

export const todo = (name?: string, detail?: string) => {
  console.warn(`TODO: ${name || 'function not implemented yet'}\n ${detail || ''}`);
};
