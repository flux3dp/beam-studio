import i18n from 'helpers/i18n';

const { lang } = i18n;
const minute = 60;
const hour = minute * 60;

export default function formatDuration(lengthInSecond = 0): string {
  if (!lengthInSecond) {
    return '';
  }

  if (lengthInSecond >= hour) {
    const hours = Number.parseInt(String(lengthInSecond / hour), 10);
    const minutes = Number.parseInt(String((lengthInSecond % hour) / minute), 10);

    return `${hours} ${lang.monitor.hour} ${minutes} ${lang.monitor.minute}`;
  }

  if (lengthInSecond >= minute) {
    const minutes = Number.parseInt(String(lengthInSecond / minute), 10);
    const seconds = Number.parseInt(String(lengthInSecond % minute), 10);

    return `${minutes} ${lang.monitor.minute} ${seconds} ${lang.monitor.second}`;
  }

  return `${Math.round(lengthInSecond)} ${lang.monitor.second}`;
}
