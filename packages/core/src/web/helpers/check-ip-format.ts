const IP_REGEX = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;

function checkIPFormat(str: string): boolean {
  return IP_REGEX.test(str);
}

export default checkIPFormat;
