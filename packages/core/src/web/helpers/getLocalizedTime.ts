import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const getLocalizedTime = async (): Promise<dayjs.Dayjs> => {
  let lang = navigator.language.toLowerCase();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    console.log(`[dayjs] Loading locale '${lang}'`);
    await import(`dayjs/locale/${lang}.js`);
    dayjs.locale(lang);
  } catch {
    console.warn(`[dayjs] Locale '${lang}' not found`);
    try {
      lang = lang.split('-')[0];
      console.log(`[dayjs] Loading locale '${lang}'`);
      await import(`dayjs/locale/${lang}.js`);
      dayjs.locale(lang);
    } catch {
      console.warn(`[dayjs] Locale '${lang}' not found, using default 'en'`);
      dayjs.locale('en');
    }
  }

  return dayjs().tz(timeZone);
};

export default getLocalizedTime;
