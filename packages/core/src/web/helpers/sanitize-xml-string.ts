/**
 * Whether the character at `i` is one XML 1.0 allows, per the spec's Char production:
 *
 *   #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
 *
 * The last range is a surrogate pair in UTF-16, so a high surrogate only counts when the code unit
 * after it is a low one — an unpaired surrogate is not a character at all.
 */
const isValidXmlChar = (xmlString: string, i: number): boolean => {
  const charCode = xmlString.charCodeAt(i);

  return (
    (charCode >= 0x0009 && charCode <= 0x000a) ||
    charCode === 0x000d ||
    (charCode >= 0x0020 && charCode <= 0xd7ff) ||
    (charCode >= 0xe000 && charCode <= 0xfffd) ||
    (charCode >= 0xd800 &&
      charCode <= 0xdbff &&
      xmlString.charCodeAt(i + 1) >= 0xdc00 &&
      xmlString.charCodeAt(i + 1) <= 0xdfff)
  );
};

const isHighSurrogate = (charCode: number): boolean => charCode >= 0xd800 && charCode <= 0xdbff;

/**
 * Removes characters that are not legal in XML 1.0.
 *
 * Scans first and returns the original string when there is nothing to remove, which is the normal
 * case. That matters because this runs on the whole document: it used to append character by
 * character unconditionally, and on one whose image hrefs are base64 that is ~132 million
 * concatenations — each a ConsString node — for a result identical to the input.
 *
 * The scan is a plain loop rather than a regex on purpose. Expressing "unpaired surrogate" as a
 * pattern needs lookaround, and how that behaves on a string of tens of MB is not something worth
 * finding out in a renderer.
 */
const sanitizeXmlString = (xmlString: string): string => {
  const { length } = xmlString;
  let firstInvalid = -1;

  for (let i = 0; i < length; i += 1) {
    if (!isValidXmlChar(xmlString, i)) {
      firstInvalid = i;
      break;
    }

    // a valid high surrogate takes its partner with it
    if (isHighSurrogate(xmlString.charCodeAt(i))) i += 1;
  }

  if (firstInvalid === -1) return xmlString;

  // Something has to go. Copy in runs between the removals rather than per character, so the cost
  // tracks how much is being removed instead of how long the document is.
  const kept: string[] = [];
  let runStart = 0;

  for (let i = firstInvalid; i < length; i += 1) {
    if (isValidXmlChar(xmlString, i)) {
      if (isHighSurrogate(xmlString.charCodeAt(i))) i += 1;

      continue;
    }

    if (i > runStart) kept.push(xmlString.slice(runStart, i));

    runStart = i + 1;
  }

  if (runStart < length) kept.push(xmlString.slice(runStart));

  return kept.join('');
};

export default sanitizeXmlString;
