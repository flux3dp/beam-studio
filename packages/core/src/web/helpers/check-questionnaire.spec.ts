import fetchMock from 'jest-fetch-mock';

import checkQuestionnaire from './check-questionnaire';

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (key) => mockGet(key),
}));

describe('test check-questionnaire', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('return null when version is not allowed', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        urls: {
          de: 'https://flux3dp.typeform.com/to/h9tsya8V',
          en: 'https://flux3dp.typeform.com/to/aXXs4ti8',
          es: 'https://flux3dp.typeform.com/to/HxcjJwCD',
          ja: 'https://flux3dp.typeform.com/to/XWMjFw46',
          'zh-cn': 'https://flux3dp.typeform.com/to/AgdFTk5k',
          'zh-tw': 'https://flux3dp.typeform.com/to/QptA0aXU',
        },
        version: 1,
      }),
    );

    const result = await checkQuestionnaire();

    expect(result).toBe(null);
  });

  test('success', async () => {
    const fetchSpy = jest.spyOn(window, 'fetch');

    fetchMock.mockResponse(
      JSON.stringify({
        urls: {
          de: 'https://flux3dp.typeform.com/to/h9tsya8V',
          en: 'https://flux3dp.typeform.com/to/aXXs4ti8',
          es: 'https://flux3dp.typeform.com/to/HxcjJwCD',
          ja: 'https://flux3dp.typeform.com/to/XWMjFw46',
          'zh-cn': 'https://flux3dp.typeform.com/to/AgdFTk5k',
          'zh-tw': 'https://flux3dp.typeform.com/to/QptA0aXU',
        },
        version: 3,
      }),
    );

    mockGet.mockReturnValue(0);

    const result = await checkQuestionnaire({ useCache: false });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenLastCalledWith('questionnaire-version');
    expect(result.version).toBe(3);
    expect(result.urls).toEqual({
      de: 'https://flux3dp.typeform.com/to/h9tsya8V',
      en: 'https://flux3dp.typeform.com/to/aXXs4ti8',
      es: 'https://flux3dp.typeform.com/to/HxcjJwCD',
      ja: 'https://flux3dp.typeform.com/to/XWMjFw46',
      'zh-cn': 'https://flux3dp.typeform.com/to/AgdFTk5k',
      'zh-tw': 'https://flux3dp.typeform.com/to/QptA0aXU',
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://id.flux3dp.com/api/questionnaire/1');

    fetchSpy.mockReset();
    await checkQuestionnaire();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
