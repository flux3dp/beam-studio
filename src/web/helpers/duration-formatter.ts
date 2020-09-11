import * as i18n from './i18n';

var lang = i18n.lang,
    oneHour = 3600,
    oneMinute = 60;

export default function(lengthInSecond) {

    lengthInSecond = lengthInSecond || 0;

    if(lengthInSecond >= oneHour) {

        var hours = parseInt(String(lengthInSecond / oneHour)),
            minutes = parseInt(String(lengthInSecond % oneHour / oneMinute));

        return `${hours} ${lang.monitor.hour} ${minutes} ${lang.monitor.minute}`;

    } else if (lengthInSecond >= oneMinute) {

        var minutes = parseInt(String(lengthInSecond / oneMinute)),
            seconds = parseInt(String(lengthInSecond % oneMinute));

        return `${minutes} ${lang.monitor.minute} ${seconds} ${lang.monitor.second}`;

    } else {

        if(!lengthInSecond) {
            return '';
        }
        return `${parseInt(lengthInSecond)} ${lang.monitor.second}`;
    }
};
