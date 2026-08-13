/**
 * Characters XML 1.0 forbids, as the inverse of the spec's Char production:
 *
 *   #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
 *
 * That last range is a surrogate pair in UTF-16, so a surrogate is only valid with its partner —
 * the two alternatives after the character class are what catch the unpaired ones.
 */
const INVALID_XML_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * Removes characters that are not legal in XML 1.0.
 *
 * When there is nothing to remove — the normal case — String.replace hands back the same string
 * rather than a copy, so this costs a scan and no allocation.
 *
 * It used to walk the string one character at a time appending to an accumulator. On a document
 * whose image hrefs are base64 that is ~132 million concatenations, each one a ConsString node:
 * measured at 5.6s and over 4GB of heap for a 123MB input, against 34ms and nothing here.
 */
const sanitizeXmlString = (xmlString: string): string => xmlString.replace(INVALID_XML_CHARS, '');

export default sanitizeXmlString;
