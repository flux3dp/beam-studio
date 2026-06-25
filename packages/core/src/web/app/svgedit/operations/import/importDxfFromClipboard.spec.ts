const mockImportDxf = jest.fn();

jest.mock('./importDxf', () => (blob: Blob) => mockImportDxf(blob));

const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  popById: (id: string) => mockPopById(id),
}));

import { importDxfFromText, looksLikeDxfText } from './importDxfFromClipboard';

// A minimal AutoCAD-style DXF: right-justified group codes, CRLF line endings.
const DXF_TEXT = [
  '  0',
  'SECTION',
  '  2',
  'ENTITIES',
  '  0',
  'LINE',
  '  0',
  'CIRCLE',
  '  0',
  'ENDSEC',
  '  0',
  'EOF',
  '',
].join('\r\n');

describe('looksLikeDxfText', () => {
  it('returns true for DXF text starting with a SECTION group code', () => {
    expect(looksLikeDxfText(DXF_TEXT)).toBe(true);
  });

  it('returns true when SECTION/ENTITIES/EOF markers are present', () => {
    expect(looksLikeDxfText('preamble\nSECTION\nstuff ENTITIES more\nEOF')).toBe(true);
  });

  it('returns false for empty input', () => {
    expect(looksLikeDxfText('')).toBe(false);
  });

  it('returns false for plain text', () => {
    expect(looksLikeDxfText('just some copied text from a document')).toBe(false);
  });

  it('returns false for SVG markup', () => {
    expect(looksLikeDxfText('<svg><rect width="10" height="10" /></svg>')).toBe(false);
  });
});

describe('importDxfFromText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockImportDxf.mockResolvedValue(true);
  });

  it('imports valid DXF text and reports success', async () => {
    const result = await importDxfFromText(DXF_TEXT);

    expect(result).toBe(true);
    expect(mockImportDxf).toHaveBeenCalledTimes(1);
    expect(mockImportDxf).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockPopById).toHaveBeenCalledWith('loading_image');
  });

  it('does nothing for non-DXF text', async () => {
    const result = await importDxfFromText('not dxf');

    expect(result).toBe(false);
    expect(mockImportDxf).not.toHaveBeenCalled();
  });

  it('returns false and closes the progress when importDxf throws', async () => {
    mockImportDxf.mockRejectedValueOnce(new Error('boom'));

    const result = await importDxfFromText(DXF_TEXT);

    expect(result).toBe(false);
    expect(mockPopById).toHaveBeenCalledWith('loading_image');
  });
});
