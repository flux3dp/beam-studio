import fs from 'fs';
import type { FileHandle } from 'fs/promises';
import path from 'path';

/**
 * An atomic file write that never needs its content joined into one buffer.
 *
 * This is write-file-atomic's contract reimplemented over a list of chunks, because that package
 * only accepts a single buffer and joining a few hundred MB to hand it over is the copy the
 * chunked save path exists to avoid.
 *
 * The guarantee that matters: the user's existing file is replaced by a single rename, which the
 * filesystem performs atomically. Everything before that happens in a temp file alongside it, so a
 * failure at any point — a full disk, a lost permission, the renderer being killed mid-write —
 * leaves the original untouched. A reader sees either the whole old file or the whole new one.
 */

/** Serialises writes to one target so two saves cannot race onto the same file. */
const activeWrites = new Map<string, Promise<void>>();

let invocations = 0;

// pid alone is not enough: two saves in one renderer would collide on the same name
const getTmpName = (filePath: string): string => {
  invocations += 1;

  return `${filePath}.${process.pid}.${Date.now().toString(36)}.${invocations}.tmp`;
};

/**
 * Temp files that exist right now. A renderer killed mid-write cannot clean up after itself, so
 * this is a best-effort sweep on the exits we do get told about.
 */
const pendingTmpFiles = new Set<string>();

process.on('exit', () => {
  pendingTmpFiles.forEach((tmpFile) => {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // the file is already gone, or we are too late to care
    }
  });
});

/**
 * Makes the rename itself durable.
 *
 * Not possible on Windows, where a directory cannot be opened — the rename is still atomic there,
 * it just is not guaranteed to have reached the disk when this returns.
 */
const syncDirectory = async (dir: string): Promise<void> => {
  let handle: FileHandle | undefined;

  try {
    handle = await fs.promises.open(dir, 'r');
    await handle.sync();
  } catch {
    // best effort
  } finally {
    await handle?.close().catch(() => {});
  }
};

const writeAll = async (handle: FileHandle, chunk: Buffer): Promise<void> => {
  let offset = 0;

  while (offset < chunk.length) {
    const { bytesWritten } = await handle.write(chunk, offset, chunk.length - offset);

    // a write that moves nothing would spin here forever; nothing should make this happen on a
    // regular file, but the loop must not be the thing that hangs the save if it does
    if (bytesWritten <= 0) throw new Error(`Write stalled with ${chunk.length - offset} bytes left`);

    offset += bytesWritten;
  }
};

const writeChunksAtomic = async (filePath: string, chunks: Buffer[]): Promise<void> => {
  // resolve symlinks and write through them: renaming over the link itself would replace the
  // user's link with a regular file
  const target = await fs.promises.realpath(filePath).catch(() => filePath);
  const existing = await fs.promises.stat(target).catch(() => null);
  const tmpPath = getTmpName(target);

  pendingTmpFiles.add(tmpPath);

  let handle: FileHandle | undefined;

  try {
    handle = await fs.promises.open(tmpPath, 'w', existing?.mode);

    for (const chunk of chunks) {
      await writeAll(handle, chunk);
    }

    // the rename is atomic, but on its own it only orders the directory entry. Without this the
    // bytes can still be in the page cache when it lands, and a crash at that moment leaves a file
    // that exists, has replaced the original, and is empty.
    await handle.sync();
    await handle.close();
    handle = undefined;

    if (existing) {
      // a new file would otherwise land with default ownership and permissions
      if (process.getuid) {
        await fs.promises.chown(tmpPath, existing.uid, existing.gid).catch(() => {});
      }

      await fs.promises.chmod(tmpPath, existing.mode).catch(() => {});
    }

    await fs.promises.rename(tmpPath, target);
    await syncDirectory(path.dirname(target));
  } finally {
    await handle?.close().catch(() => {});
    // a no-op once the rename succeeded, and the cleanup of a partial file otherwise
    await fs.promises.unlink(tmpPath).catch(() => {});
    pendingTmpFiles.delete(tmpPath);
  }
};

export const writeFileChunksAtomic = async (filePath: string, chunks: Buffer[]): Promise<void> => {
  const key = path.resolve(filePath);
  const previous = activeWrites.get(key);
  // chained rather than awaited: a failed write must not stop the one queued behind it
  const current = (previous ?? Promise.resolve()).catch(() => {}).then(() => writeChunksAtomic(filePath, chunks));

  activeWrites.set(key, current);

  try {
    await current;
  } finally {
    if (activeWrites.get(key) === current) activeWrites.delete(key);
  }
};

export default writeFileChunksAtomic;
