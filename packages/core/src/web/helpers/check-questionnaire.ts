import storage from '@core/implementations/storage';

const MIN_ALLOWED_VERSION = 2;

let resultCache = null;

const checkQuestionnaire = async (
  opts: {
    allowOldVersion?: boolean;
    useCache?: boolean;
  } = {},
): Promise<{ urls: { [key: string]: string }; version: number }> => {
  const { allowOldVersion = false, useCache = true } = opts;

  try {
    let result;

    if (resultCache && useCache) {
      result = resultCache;
    } else {
      const resp = await fetch('https://id.flux3dp.com/api/questionnaire/1');

      result = await resp.json();
      resultCache = result;
    }

    const lastQuestionnaireVersion = storage.get('questionnaire-version') || 0;

    if (!allowOldVersion && lastQuestionnaireVersion >= result.version) {
      return null;
    }

    if (result.version >= MIN_ALLOWED_VERSION) {
      return result;
    }

    return null;
  } catch {
    return null;
  }
};

export default checkQuestionnaire;
