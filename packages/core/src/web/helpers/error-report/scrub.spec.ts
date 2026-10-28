import { SCRUBBED_STORAGE_KEYS, scrubReport } from './scrub';

describe('scrubReport', () => {
  test.each([
    ['macOS path', '/Users/alice/Library/Fonts/a.ttf', '~/Library/Fonts/a.ttf'],
    ['Linux path', '/home/alice/.config/beam-studio', '~/.config/beam-studio'],
    ['Windows path', 'C:\\Users\\alice\\AppData\\Local\\x', '~\\AppData\\Local\\x'],
    ['Windows path, lowercase drive and folder', 'c:\\users\\alice\\Desktop', '~\\Desktop'],
    ['Windows path, JSON-escaped backslashes', '"C:\\\\Users\\\\alice\\\\AppData"', '"~\\\\AppData"'],
    ['Windows path, forward slashes (file URL)', 'file:///C:/Users/alice/Desktop/a.svg', 'file:///~/Desktop/a.svg'],
    [
      'ws log line with font path',
      '> select_font /Users/alice/Library/Fonts/a.ttf string',
      '> select_font ~/Library/Fonts/a.ttf string',
    ],
    [
      'fluxghost --debug config line',
      'will store in /Users/alice/Library/Preferences/',
      'will store in ~/Library/Preferences/',
    ],
    ['username with dot and dash', '/Users/a.b-c/x', '~/x'],
    ['macOS username with space', '/Users/Dean Sung/Library/Fonts/a.ttf', '~/Library/Fonts/a.ttf'],
    ['Windows username with space', 'C:\\Users\\Dean Sung\\Documents\\a.beam', '~\\Documents\\a.beam'],
    ['Windows username with space, JSON-escaped', '"C:\\\\Users\\\\Dean Sung\\\\Documents"', '"~\\\\Documents"'],
    ['bare home dir followed by words', 'saved in /Users/alice just now', 'saved in ~ just now'],
  ])('%s', (_name, input, expected) => {
    expect(scrubReport(input)).toBe(expected);
  });

  test('replaces every occurrence, not only the first', () => {
    expect(scrubReport('/Users/alice/a /Users/alice/b')).toBe('~/a ~/b');
  });

  test('leaves unrelated text untouched', () => {
    const text = 'https://id.flux3dp.com/users/me\n/Applications/Beam Studio.app\nC:\\Program Files\\x';

    expect(scrubReport(text)).toBe(text);
  });
});

describe('SCRUBBED_STORAGE_KEYS', () => {
  test('covers the keys that embed user paths, the FLUX ID email or the machine nickname', () => {
    expect(SCRUBBED_STORAGE_KEYS).toEqual([
      'recent_files',
      'auto-save-config',
      'ador-backup-path',
      'flux-101',
      'maintenance-records',
    ]);
  });
});
