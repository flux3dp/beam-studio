/**
 * Log current JS heap usage with a label (Chrome/Electron only — performance.memory).
 * Use to track memory peaks along heavy pipelines (e.g. fcode export). Log sizes, never content.
 */
const logMemory = (label: string, extra?: number | string): void => {
  const memory = (performance as { memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number } }).memory;

  if (!memory) return;

  const used = (memory.usedJSHeapSize / 1048576).toFixed(0);
  const limit = (memory.jsHeapSizeLimit / 1048576).toFixed(0);

  console.log(`[mem] ${label}${extra === undefined ? '' : ` (${extra})`} — heap ${used}/${limit}MB`);
};

export default logMemory;
