/**
 * Artwork imported from the Noun Project carries `data-np="1"`. Disassembling a shape copies the
 * attribute onto every descendant, so a plain `<path>` can be Noun Project artwork too.
 */
export const NOUN_PROJECT_SELECTOR = '[data-np="1"]';

/**
 * Whether the element is Noun Project artwork, or sits inside a shape that is.
 *
 * The artwork is licensed, not ours to reshape: editing its nodes would produce a derivative the
 * license does not cover, which is the same reason exports leave it out.
 */
export const isNounProjectElement = (elem?: Element | null): boolean => Boolean(elem?.closest?.(NOUN_PROJECT_SELECTOR));

export default isNounProjectElement;
