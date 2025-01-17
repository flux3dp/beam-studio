/**
 * blob segments
 */
export default (blob: Blob, callback): void => {
  const fn = callback || function () { };
  const CHUNK_PKG_SIZE = 4096;

  // split up to pieces
  for (let i = 0; i < blob.size; i += CHUNK_PKG_SIZE) {
    fn(blob.slice(i, i + CHUNK_PKG_SIZE));
  }
};
