/**
 * Detect if a PostScript name matches Google Font pattern
 * Google Fonts use pattern: fontFamily.replace(/\s+/g, '') + '-Regular'
 * Examples: "OpenSans-Regular", "RobotoMono-Regular", "NotoSans-Regular"
 */
export const isGoogleFontPostScriptName = (postscriptName: string): boolean => {
  return postscriptName.endsWith('-Regular') && !postscriptName.includes(' ');
};

/**
 * Extract font family name from Google Font PostScript name
 * "OpenSans-Regular" -> "Open Sans"
 * "RobotoMono-Regular" -> "Roboto Mono"
 */
export const extractFamilyFromPostScriptName = (postscriptName: string): null | string => {
  if (!isGoogleFontPostScriptName(postscriptName)) {
    return null;
  }

  return (
    postscriptName
      // Remove "-Regular" suffix
      .split('-')[0]
      // Add spaces before capital letters
      .replace(/([A-Z])/g, ' $1')
      .trim()
  );
};
