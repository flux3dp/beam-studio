// TODO: add test
const sanitizeXmlString = (xmlString: string): string => {
  // ref: https://stackoverflow.com/questions/29031792/detect-non-valid-xml-characters-javascript
  const validXmlChar = (i: number) => {
    const charCode = xmlString.charCodeAt(i);
    return (
      (charCode >= 0x0009 && charCode <= 0x000A)
      || charCode === 0x000D
      || (charCode >= 0x0020 && charCode <= 0xD7FF)
      || (charCode >= 0xE000 && charCode <= 0xFFFD)
      || (charCode >= 0xD800
        && charCode <= 0xDBFF
        && xmlString.charCodeAt(i + 1) >= 0xDC00
        && xmlString.charCodeAt(i + 1) <= 0xDFFF
      )
    );
  };

  let res = '';
  for (let i = 0; i < xmlString.length; i += 1) {
    const char = xmlString[i];
    if (validXmlChar(i)) {
      res += char;
      if (char >= '\uD800' && char <= '\uDBFF') {
        // If the character is a high surrogate, we need to include the next character as well (the low surrogate).
        i += 1;
        res += xmlString[i];
      }
    }
  }
  return res;
};

export default sanitizeXmlString;
