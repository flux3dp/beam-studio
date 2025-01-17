export default (dataString: string) => {
  const pairs = dataString.split('&');
  const data: { [key: string]: string } = {};
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i].split('=');
    if (pair.length > 1) {
      data[pair[0]] = pair[1];
    }
  }
  return data;
};
