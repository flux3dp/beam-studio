const ipRex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

const checkIPFormat = (ip: string): boolean => {
  const isIPFormatValid = ipRex.test(ip);
  return isIPFormatValid;
};

export default checkIPFormat;
