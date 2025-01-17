export default (obj): boolean => {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(keys[i])) {
      return false;
    }
  }
  return true;
};
