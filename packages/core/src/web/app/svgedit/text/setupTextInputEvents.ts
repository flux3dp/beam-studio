import { getOS } from '@core/helpers/getOS';
import shortcuts from '@core/helpers/shortcuts';
import { isMobile } from '@core/helpers/system-helper';

import textActions from './textactions';
import textedit from './textedit';

/**
 * setupTextInputEvents
 * Setup event listeners for text input element, including keydown, keyup and input event
 * Handle text editing, new line adding and undo/redo in text input
 * @returns void
 */
export const setupTextInputEvents = () => {
  let wasNewLineAdded = false;
  const checkFunctionKeyPressed = (evt: KeyboardEvent) => {
    return (getOS() === 'MacOS' && evt.metaKey) || (getOS() !== 'MacOS' && evt.ctrlKey);
  };

  const textInput = document.getElementById('text') as HTMLInputElement;

  window.addEventListener(
    'input',
    (e) => {
      if (shortcuts.isInBaseScope()) {
        const evt = e as InputEvent;

        if (evt.inputType === 'historyRedo' || evt.inputType === 'historyUndo') {
          const { activeElement } = document;

          if (
            activeElement &&
            ['input', 'textarea'].includes(activeElement.tagName.toLowerCase()) &&
            evt.target !== activeElement
          ) {
            evt.preventDefault();
            evt.stopPropagation();

            return;
          }
        }
      }
    },
    { capture: true },
  );

  const textInputInputKeyupHandler = (evt: Event) => {
    evt.stopPropagation();

    if ((evt as KeyboardEvent).key === 'Enter' && !wasNewLineAdded) {
      textActions.toSelectMode(true);
    } else if (textActions.isEditing) {
      textedit.setTextContent(textInput.value);
    }

    if ((evt as KeyboardEvent).key !== 'Shift') {
      wasNewLineAdded = false;
    }
  };

  textInput.addEventListener('input', textInputInputKeyupHandler);
  textInput.addEventListener('keyup', textInputInputKeyupHandler);

  textInput.addEventListener('keydown', (evt: KeyboardEvent) => {
    evt.stopPropagation();

    if (evt.key === 'ArrowUp') {
      evt.preventDefault();
      textActions.onUpKey();
    } else if (evt.key === 'ArrowDown') {
      evt.preventDefault();
      textActions.onDownKey();
    } else if (evt.key === 'ArrowLeft') {
      evt.preventDefault();
      textActions.onLeftKey();
    } else if (evt.key === 'ArrowRight') {
      evt.preventDefault();
      textActions.onRightKey();
    } else if (evt.key === 'Escape') {
      textActions.toSelectMode();
    }

    const isFunctionKeyPressed = checkFunctionKeyPressed(evt);

    if ((isMobile() || evt.shiftKey) && evt.key === 'Enter') {
      evt.preventDefault();
      textActions.newLine();
      textedit.setTextContent(textInput.value);
      wasNewLineAdded = true;
    } else if (isFunctionKeyPressed && evt.key === 'c') {
      evt.preventDefault();
      textActions.copyText();
    } else if (isFunctionKeyPressed && evt.key === 'x') {
      evt.preventDefault();
      textActions.cutText();
      textedit.setTextContent(textInput.value);
    } else if (isFunctionKeyPressed && evt.key === 'v') {
      evt.preventDefault();
      textActions.pasteText();
      textedit.setTextContent(textInput.value);
    } else if (isFunctionKeyPressed && evt.key === 'a') {
      evt.preventDefault();
      textActions.selectAll();
      textedit.setTextContent(textInput.value);
    } else if (isFunctionKeyPressed && evt.key === 'z') {
      if (getOS() === 'MacOS') {
        evt.preventDefault();
      }
    }
  });

  textInput.addEventListener('blur', () => {
    if (textActions.isEditing) {
      textActions.toSelectMode();
      textInput.value = '';
    }
  });
};

export default setupTextInputEvents;
