import { consumeGizmoDragged, markGizmoDragged, resetGizmoDragged } from './gizmoDrag';

describe('inner engraving gizmoDrag', () => {
  beforeEach(() => resetGizmoDragged());

  test('a click with no drag before it is a selection', () => {
    expect(consumeGizmoDragged()).toBe(false);
  });

  test('the click that ends a drag is skipped, and only that one', () => {
    markGizmoDragged();

    expect(consumeGizmoDragged()).toBe(true);
    expect(consumeGizmoDragged()).toBe(false);
  });

  test('a new pointer down clears a drag that no click followed', () => {
    markGizmoDragged();
    resetGizmoDragged();

    expect(consumeGizmoDragged()).toBe(false);
  });
});
