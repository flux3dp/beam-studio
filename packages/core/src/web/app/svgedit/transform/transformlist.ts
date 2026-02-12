export const getTransformList = (
  elem: SVGGradientElement | SVGGraphicsElement | SVGPatternElement,
): null | SVGTransformList => {
  // https://developer.mozilla.org/en-US/docs/Web/API/SVGTransform
  // svg transform should be supported by most of the modern browsers
  if (!elem) return null;

  if ('transform' in elem) return elem.transform.baseVal;

  if ('gradientTransform' in elem) return elem.gradientTransform.baseVal;

  if ('patternTransform' in elem) return elem.patternTransform.baseVal;

  return null;
};

export default {
  getTransformList,
};
