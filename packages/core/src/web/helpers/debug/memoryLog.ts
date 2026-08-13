/**
 * Memory / duration probes for the save and export paths.
 *
 * Both paths hold hundreds of MB at once on image-heavy files, and when the renderer runs out the
 * whole tab is killed with nothing written to the console. These probes exist so a crash report can
 * be turned into a number: run the operation, read the log, see which step grew.
 *
 * The interesting number is usually `arrayBuffers` / `external`, not the JS heap — Buffer, Blob and
 * decoded images all live outside it, so a heap that looks flat says nothing about the real usage.
 */

const MB = 1024 * 1024;

interface MemorySample {
  /** Off-heap memory: Buffer, ArrayBuffer, Blob. Where the save path actually spends. */
  arrayBuffers?: number;
  external?: number;
  jsHeap?: number;
  /** Resident set size — the number the OS kills the renderer over. */
  rss?: number;
}

let enabled = true;

/** Toggle from devtools: `require('@core/helpers/debug/memoryLog').setMemoryLogEnabled(false)` */
export const setMemoryLogEnabled = (value: boolean): void => {
  enabled = value;
};

const readSample = (): MemorySample | null => {
  // Electron renderer: the only source that sees off-heap memory
  const nodeProcess = (globalThis as { process?: { memoryUsage?: () => NodeJS.MemoryUsage } }).process;

  if (typeof nodeProcess?.memoryUsage === 'function') {
    try {
      const { arrayBuffers, external, heapUsed, rss } = nodeProcess.memoryUsage();

      return { arrayBuffers, external, jsHeap: heapUsed, rss };
    } catch {
      // fall through to performance.memory
    }
  }

  // Web: JS heap only, and Chrome quantizes it — treat it as a coarse hint
  const perfMemory = (performance as { memory?: { usedJSHeapSize: number } }).memory;

  if (perfMemory) return { jsHeap: perfMemory.usedJSHeapSize };

  return null;
};

const formatDelta = (name: string, before?: number, after?: number): string => {
  if (before === undefined || after === undefined) return '';

  const delta = (after - before) / MB;
  const sign = delta >= 0 ? '+' : '';

  return ` | ${name} ${(before / MB).toFixed(0)}→${(after / MB).toFixed(0)}MB (${sign}${delta.toFixed(0)})`;
};

const formatSample = (sample: MemorySample): string =>
  (['rss', 'arrayBuffers', 'external', 'jsHeap'] as const)
    .filter((key) => sample[key] !== undefined)
    .map((key) => ` | ${key} ${(sample[key]! / MB).toFixed(0)}MB`)
    .join('');

/** One-shot snapshot, for marking a point in time rather than wrapping a call. */
export const logMemory = (label: string): void => {
  if (!enabled) return;

  const sample = readSample();

  console.log(`[mem] ${label}${sample ? formatSample(sample) : ' | unavailable'}`);
};

const report = (label: string, before: MemorySample | null, start: number): void => {
  const duration = performance.now() - start;
  const after = readSample();
  const deltas =
    before && after
      ? (['rss', 'arrayBuffers', 'external', 'jsHeap'] as const)
          .map((key) => formatDelta(key, before[key], after[key]))
          .join('')
      : ' | unavailable';

  console.log(`[mem] ${label} | ${duration.toFixed(0)}ms${deltas}`);
};

/**
 * Wrap a step of the save / export path: logs how long it took and how much memory it kept.
 *
 * The delta is what the step *retained*, not its peak — a step that allocates 4GB and frees it
 * again reads as ~0 here while still being the one that killed the tab. Pair a suspicious duration
 * with a flat delta and assume churn.
 */
export const withMemoryLog = async <T>(label: string, fn: () => Promise<T> | T): Promise<T> => {
  if (!enabled) return await fn();

  const before = readSample();
  const start = performance.now();

  try {
    return await fn();
  } finally {
    report(label, before, start);
  }
};

/** Same as withMemoryLog, for steps that must stay synchronous. */
export const withMemoryLogSync = <T>(label: string, fn: () => T): T => {
  if (!enabled) return fn();

  const before = readSample();
  const start = performance.now();

  try {
    return fn();
  } finally {
    report(label, before, start);
  }
};

export default { logMemory, setMemoryLogEnabled, withMemoryLog, withMemoryLogSync };
