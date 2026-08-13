/**
 * These run against a real temp directory rather than a mocked fs: the whole point of the module is
 * what it leaves on disk when something goes wrong, and a mock would only assert that the calls
 * were made in the order we already wrote them in.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

import writeFileChunksAtomic from './writeFileChunksAtomic';

const ORIGINAL = 'the user file that must survive';

describe('writeFileChunksAtomic', () => {
  let dir: string;
  let target: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'beam-atomic-'));
    target = path.join(dir, 'scene.beam');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { force: true, recursive: true });
  });

  const leftovers = () => fs.readdirSync(dir).filter((name) => name.endsWith('.tmp'));

  test('writes the chunks as one concatenated file', async () => {
    await writeFileChunksAtomic(target, [Buffer.from('abc'), Buffer.from('def'), Buffer.from('ghi')]);

    expect(fs.readFileSync(target, 'utf8')).toBe('abcdefghi');
    expect(leftovers()).toEqual([]);
  });

  test('replaces an existing file and leaves no temp file behind', async () => {
    fs.writeFileSync(target, ORIGINAL);

    await writeFileChunksAtomic(target, [Buffer.from('replacement')]);

    expect(fs.readFileSync(target, 'utf8')).toBe('replacement');
    expect(leftovers()).toEqual([]);
  });

  test('handles an empty chunk list and zero-length chunks', async () => {
    await writeFileChunksAtomic(target, []);
    expect(fs.readFileSync(target, 'utf8')).toBe('');

    await writeFileChunksAtomic(target, [Buffer.alloc(0), Buffer.from('x'), Buffer.alloc(0)]);
    expect(fs.readFileSync(target, 'utf8')).toBe('x');
  });

  test('a failure during the write leaves the original intact', async () => {
    fs.writeFileSync(target, ORIGINAL);

    const error = new Error('disk full');

    jest.spyOn(fs.promises, 'rename').mockRejectedValueOnce(error);

    await expect(writeFileChunksAtomic(target, [Buffer.from('never lands')])).rejects.toThrow('disk full');

    // the guarantee that matters: the user still has the file they had
    expect(fs.readFileSync(target, 'utf8')).toBe(ORIGINAL);
    expect(leftovers()).toEqual([]);
  });

  test('a failure before the rename leaves the original intact', async () => {
    fs.writeFileSync(target, ORIGINAL);

    jest.spyOn(fs.promises, 'open').mockRejectedValueOnce(new Error('EACCES'));

    await expect(writeFileChunksAtomic(target, [Buffer.from('never lands')])).rejects.toThrow('EACCES');

    expect(fs.readFileSync(target, 'utf8')).toBe(ORIGINAL);
    expect(leftovers()).toEqual([]);
  });

  test('writes through a symlink instead of replacing it', async () => {
    const real = path.join(dir, 'real.beam');
    const link = path.join(dir, 'link.beam');

    fs.writeFileSync(real, ORIGINAL);
    fs.symlinkSync(real, link);

    await writeFileChunksAtomic(link, [Buffer.from('through the link')]);

    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(real, 'utf8')).toBe('through the link');
  });

  test('preserves the permissions of the file it replaces', async () => {
    fs.writeFileSync(target, ORIGINAL);
    fs.chmodSync(target, 0o600);

    await writeFileChunksAtomic(target, [Buffer.from('replacement')]);

    expect(fs.statSync(target).mode & 0o777).toBe(0o600);
  });

  test('serialises concurrent writes to the same file, so neither is interleaved', async () => {
    const first = Buffer.from('1'.repeat(5000));
    const second = Buffer.from('2'.repeat(5000));

    await Promise.all([writeFileChunksAtomic(target, [first, first]), writeFileChunksAtomic(target, [second, second])]);

    const written = fs.readFileSync(target, 'utf8');

    // whichever landed last, it is one write's content in full and not a mix of the two
    expect([first.toString().repeat(2), second.toString().repeat(2)]).toContain(written);
    expect(leftovers()).toEqual([]);
  });

  test('a failed write does not block the one queued behind it', async () => {
    jest.spyOn(fs.promises, 'rename').mockRejectedValueOnce(new Error('transient'));

    const failing = writeFileChunksAtomic(target, [Buffer.from('doomed')]);
    const following = writeFileChunksAtomic(target, [Buffer.from('survivor')]);

    await expect(failing).rejects.toThrow('transient');
    await following;

    expect(fs.readFileSync(target, 'utf8')).toBe('survivor');
    expect(leftovers()).toEqual([]);
  });

  test('writes a payload spread over many chunks', async () => {
    const chunks = Array.from({ length: 500 }, (_, i) => Buffer.from(`${i},`));

    await writeFileChunksAtomic(target, chunks);

    expect(fs.readFileSync(target, 'utf8')).toBe(chunks.map((chunk) => chunk.toString()).join(''));
  });
});
