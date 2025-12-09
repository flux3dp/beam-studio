import type { Style } from '@core/helpers/api/ai-image-config';
import { getInputFieldsForStyle } from './inputFields';

const STYLES: Style[] = [
  {
    displayName: 'Cute Logo',
    id: 'logo-cute',
    inputFields: [
      { key: 'description', label: 'Desc', maxLength: 2000, placeholder: '...', required: false },
      { key: 'textToDisplay', label: 'Text', maxLength: 50, placeholder: '...', required: true },
    ],
    modes: ['text-to-image'],
    previewImage: '',
    tags: ['logo'],
  },
  {
    displayName: 'Customize',
    id: 'customize',
    inputFields: [{ key: 'description', label: 'Desc', placeholder: '...', required: false }],
    modes: ['text-to-image'],
    previewImage: '',
    tags: [],
  },
  {
    displayName: 'Empty',
    id: 'empty-style',
    inputFields: [],
    modes: ['text-to-image'],
    previewImage: '',
    tags: [],
  },
];

describe('getInputFieldsForStyle', () => {
  // Table-driven tests for standard cases
  const testCases = [
    { desc: 'returns fields for existing style', expectedKeys: ['description', 'textToDisplay'], styleId: 'logo-cute' },
    { desc: 'returns fields for plain style', expectedKeys: ['description'], styleId: 'customize' },
    { desc: 'returns empty array for style with no fields', expectedKeys: [], styleId: 'empty-style' },
    { desc: 'returns empty array for unknown style', expectedKeys: [], styleId: 'unknown-style' },
    { desc: 'returns empty array for null styleId', expectedKeys: [], styleId: null },
    { desc: 'returns empty array for empty string styleId', expectedKeys: [], styleId: '' },
  ];

  testCases.forEach(({ desc, expectedKeys, styleId }) => {
    it(desc, () => {
      const fields = getInputFieldsForStyle(styleId, STYLES);

      expect(fields.map((f) => f.key)).toEqual(expectedKeys);
    });
  });

  // Edge cases requiring different data inputs
  describe('data availability edge cases', () => {
    it('returns empty array when backend data is undefined', () => {
      expect(getInputFieldsForStyle('logo-cute', undefined)).toEqual([]);
    });

    it('returns empty array when backend data is empty', () => {
      expect(getInputFieldsForStyle('logo-cute', [])).toEqual([]);
    });

    it('preserves full field properties', () => {
      const fields = getInputFieldsForStyle('logo-cute', STYLES);
      const textField = fields.find((f) => f.key === 'textToDisplay');

      expect(textField).toEqual({
        key: 'textToDisplay',
        label: 'Text',
        maxLength: 50,
        placeholder: '...',
        required: true,
      });
    });
  });
});
