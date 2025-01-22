/**
 * simply check the string is json format
 */
export default (str: string): boolean => {
  try {
    JSON.parse(str);

    return true;
  } catch {
    return false;
  }
};
