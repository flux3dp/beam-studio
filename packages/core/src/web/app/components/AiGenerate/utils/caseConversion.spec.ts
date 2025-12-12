import { objectToSnakeCase } from './caseConversion';

describe('objectToSnakeCase', () => {
  it('should convert object keys to snake_case', () => {
    const input = {
      description: 'Test',
      textToDisplay: 'MeowWoof',
    };

    const result = objectToSnakeCase(input);

    expect(result).toEqual({
      description: 'Test',
      text_to_display: 'MeowWoof',
    });
  });

  it('should handle empty object', () => {
    expect(objectToSnakeCase({})).toEqual({});
  });
});
