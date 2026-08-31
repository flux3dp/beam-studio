// Strips characters that are invalid in XML 1.0.
// ref: https://stackoverflow.com/questions/29031792/detect-non-valid-xml-characters-javascript
// The `u` flag makes the class operate on code points, so valid surrogate pairs
// (U+10000-U+10FFFF) pass through and lone surrogates are stripped.
// eslint-disable-next-line no-control-regex -- matching control chars is the point: they are the invalid XML chars
const invalidXmlChars = /[^\u{9}\u{A}\u{D}\u{20}-\u{D7FF}\u{E000}-\u{FFFD}\u{10000}-\u{10FFFF}]/gu;

// IMPORTANT: the returned string must be a fresh, independent copy.
// When a large original string (e.g. a 39MB svg block decoded from a .beam buffer) is
// passed downstream unchanged, the renderer hard-crashes (render-process-gone,
// reason "crashed", exit code 10 / SIGBUS) on import; a freshly built string does not.
// `replace` with no matches and `slice` both return views tied to the original, so the
// `(' ' + s).slice(1)` idiom forces V8 to materialize a new backing store.
const forceCopy = (s: string): string => (' ' + s).slice(1);

const sanitizeXmlString = (xmlString: string): string => forceCopy(xmlString.replace(invalidXmlChars, ''));

export default sanitizeXmlString;
