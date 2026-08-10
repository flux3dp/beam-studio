import { getStlSources } from '@core/app/svgedit/stl/sources';

/**
 * Base64 for the `stlObjects` payload.
 *
 * ⚠️ Base64 is a **backend limitation, not a preference**: swiftray's `processBinaryMessage()`
 * decodes the whole websocket frame with `QString::fromUtf8()`, so a raw binary frame would be
 * mangled (invalid UTF-8 sequences become U+FFFD). Base64 is pure ASCII, so it survives both the
 * JSON string and that decode. Cost is the usual 4/3 inflation.
 *
 * Uses `FileReader` rather than `btoa(String.fromCharCode(...))`: the latter blows the argument
 * limit on large meshes, and chunking it would block the main thread for tens of MB.
 */
const toBase64 = (buffer: ArrayBuffer): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error('Failed to encode STL mesh'));
    reader.onload = () => {
      const result = reader.result as string;

      // strip the "data:application/octet-stream;base64," prefix
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(new Blob([buffer]));
  });

/**
 * The `stlObjects` map sent alongside the svg string in the swiftray `loadSVG` payload (A-3).
 *
 * Keyed by the id of the projection rect, which is how swiftray links a `data-stl` placeholder in
 * the svg back to its mesh.
 *
 * Returns `undefined` when there is nothing to send, to keep the payload untouched for every
 * non inner-engraving job.
 */
const getStlObjects = async (): Promise<Record<string, string> | undefined> => {
  const sources = Object.entries(getStlSources());

  if (sources.length === 0) return undefined;

  const entries = await Promise.all(sources.map(async ([id, buffer]) => [id, await toBase64(buffer)] as const));

  return Object.fromEntries(entries);
};

export default getStlObjects;
