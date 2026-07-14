import { isMobile } from '@core/app/stores/screenStore';
import { getOS } from '@core/helpers/getOS';
import shortcuts from '@core/helpers/shortcuts';

import { redo, undo } from '../history/utils';

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

    // Windows may still trigger input event with inputType 'historyUndo' or 'historyRedo' when text input is not focused
    // so we need to check if the text input is focused before handling undo/redo
    if (evt.type === 'input' && document.activeElement !== textInput) {
      if ((evt as InputEvent).inputType === 'historyRedo') {
        redo();
      } else if ((evt as InputEvent).inputType === 'historyUndo') {
        undo();
      }

      return;
    }

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

  textInput.addEventListener('blur', (e) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;

    // Focus moving to the text content block: the user is switching to edit the
    // content there, so keep editing instead of exiting (which would delete a
    // newly-created empty text element via toSelectMode).
    if (relatedTarget?.id === 'text-content-textarea') {
      return;
    }

    // if relatedTarget is null: click to not interactive area (or svg canvas), do nothing.
    if (relatedTarget && textActions.isEditing) {
      textActions.toSelectMode();
      textInput.value = '';
    }
  });
};

export default setupTextInputEvents;
