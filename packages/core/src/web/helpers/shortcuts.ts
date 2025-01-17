import { modifierKeys } from 'app/constants/modifierKeys';
import { isMac, isMobile } from 'helpers/system-helper';
/**
 * setting up shortcut
 */
interface ShortcutEvent {
  keySet: string;
  callback: (event: KeyboardEvent) => void;
  priority: number;
  isPreventDefault: boolean;
}

interface RegisterOptions {
  isBlocking?: boolean;
  isPreventDefault?: boolean;
  splitKey?: string;
}

const eventScopes: Array<Array<ShortcutEvent>> = [[]];
const getCurrentEvents = () => eventScopes[eventScopes.length - 1];
const currentPressedKeys = new Set<string>();
let hasBind = false;

window.addEventListener('blur', () => currentPressedKeys.clear());

const parseKeySet = (keySet: string, splitKey = '+'): string =>
  keySet
    .replace(/Fnkey/gi, isMac() ? 'Meta' : 'Control')
    .toLowerCase()
    .split(splitKey)
    .sort()
    .join('+');

const matchedEventsByKeySet = (keySet: string) =>
  getCurrentEvents().reduce(
    (acc, cur) => {
      if (cur.keySet === keySet) {
        if (cur.priority > acc.maxPriority) {
          acc.matches = [cur];
          acc.maxPriority = cur.priority;
        } else if (cur.priority === acc.maxPriority) {
          acc.matches.push(cur);
        }
      }

      return acc;
    },
    { matches: Array.of<ShortcutEvent>(), maxPriority: 0 }
  );

let layoutMap: Map<string, string> | null = null;
navigator.keyboard?.getLayoutMap?.().then((map) => {
  layoutMap = map;
});

/**
 * getKeyFromEvent
 * @description
 * The value of `event.key` may vary depending on the Input Method Editor (IME) being used.
 * On the other hand, `event.code` represents the physical key being pressed but might not correspond
 * correctly to the character for different keyboard layouts.
 *
 * For example, a `KeyboardLayoutMap` may map keys like:
 * - 'Digit1' => '1'
 * - 'KeyA' => 'a'
 * - 'Space' => ' '
 * - 'Enter' => 'Enter'
 *
 * When possible, prefer using `event.code` along with a `KeyboardLayoutMap` for consistent results.
 * If the `KeyboardLayoutMap` is unavailable, fallback to using `event.key`.
 *
 * References:
 * - https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
 * - https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
 * - https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
 * - https://developer.mozilla.org/en-US/docs/Web/API/KeyboardLayoutMap
 */
const getKeyFromEvent = (event: KeyboardEvent): string => {
  const key = layoutMap?.has(event.code) ? layoutMap.get(event.code) : event.key;
  return key?.toLowerCase();
};

const keyupEvent = (event: KeyboardEvent) => {
  /**
   * on MacOs, the keyup event is not triggered when the key is released if Meta key is pressed
   * so we need to clear the currentPressedKeys when Meta key is released
   */
  if (event.key === 'Meta') {
    currentPressedKeys.clear();
  } else {
    const key = getKeyFromEvent(event);
    if (key) currentPressedKeys.delete(key);
  }
};

const isFocusingOnInputs = () => {
  if (!document.activeElement) return false;
  return (
    document.activeElement.tagName.toLowerCase() === 'input' ||
    document.activeElement?.getAttribute('role') === 'slider'
  );
};

const keydownEvent = (event: KeyboardEvent) => {
  // ignore autocomplete input
  if (event.key === undefined || isFocusingOnInputs()) {
    return;
  }
  const currentKey = getKeyFromEvent(event);
  if (!currentKey) return;

  /**
   * on MacOs, the keyup event is not triggered when the non-modifier key is released if metaKey is pressed
   * so we need to clear the currentPressedKeys when metaKey is pressed
   */
  if (event.metaKey) {
    currentPressedKeys.forEach((key) => {
      if (!modifierKeys.includes(key)) {
        currentPressedKeys.delete(key);
      }
    });
  } else if (currentPressedKeys.has('meta')) {
    currentPressedKeys.clear();
  }

  currentPressedKeys.add(currentKey);

  const currentKeySet = [...currentPressedKeys].sort().join('+');
  const { matches } = matchedEventsByKeySet(currentKeySet);

  matches.forEach((matchedEvent) => {
    if (matchedEvent.isPreventDefault) {
      event.preventDefault();
    }

    matchedEvent.callback.apply(null, [event]);
  });
};

const initialize = (): void => {
  if (hasBind === false) {
    window.addEventListener('keyup', keyupEvent);
    window.addEventListener('keydown', keydownEvent);

    hasBind = true;
  }
};

const unsubscribe = (eventToUnsubscribe: ShortcutEvent) => {
  const events = getCurrentEvents();
  const idx = events.indexOf(eventToUnsubscribe);
  if (idx >= 0) events.splice(idx, 1);
};

export default {
  on(
    keys: Array<string>,
    callback: (event: KeyboardEvent) => void,
    { isBlocking = false, isPreventDefault = true, splitKey = '+' }: RegisterOptions = {}
  ): (() => void) | null {
    if (isMobile()) {
      return null;
    }

    const keySets = keys.map((key) => parseKeySet(key, splitKey));
    const newEvents: Array<ShortcutEvent> = keySets.map((keySet) => ({
      keySet,
      callback,
      priority: isBlocking ? matchedEventsByKeySet(keySet).maxPriority + 1 : 0,
      isPreventDefault,
    }));
    const currentEvents = getCurrentEvents();
    newEvents.forEach((newEvent) => {
      currentEvents.push(newEvent);
    });

    initialize();

    return () => {
      newEvents.forEach((newEvent) => {
        unsubscribe(newEvent);
      });
    };
  },
  off(keySets: Array<string>): void {
    const currentEvents = getCurrentEvents();
    for (let i = currentEvents.length - 1; i >= 0; i--) {
      if (keySets.includes(currentEvents[i].keySet)) {
        currentEvents.splice(i, 1);
      }
    }
  },
  initialize,
  enterScope(): () => void {
    const newEvents: Array<ShortcutEvent> = [];
    eventScopes.push(newEvents);
    const exitScope = () => {
      // use splice instead of pop to in case another scope is entered before exitted
      const idx = eventScopes.indexOf(newEvents);
      if (idx >= 0) {
        eventScopes.splice(idx, 1);
      }
    };
    return exitScope;
  },
  isInBaseScope(): boolean {
    return eventScopes.length === 1;
  },
};
