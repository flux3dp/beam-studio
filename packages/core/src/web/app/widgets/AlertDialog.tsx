import React, { useState } from 'react';

import i18n from '@core/helpers/i18n';
import type { IButton } from '@core/interfaces/IButton';

import ButtonGroup from './ButtonGroup';

let lang = i18n.lang.buttons;

interface AlertDialogProps {
  buttons?: IButton[];
  caption?: string;
  checkbox?: string;
  checkedCallback?: (...args: any[]) => void;
  displayImages?: boolean;
  images?: string[];
  imgClass?: string;
  message?: React.JSX.Element | string;
  onClose?: (...args: any[]) => void;
  onCustom?: (...args: any[]) => void;
}

/**
 * @deprecated The method should not be used
 */
const AlertDialog = ({
  buttons = [],
  caption = '',
  checkbox = '',
  checkedCallback = () => {},
  displayImages = false,
  images = [],
  imgClass = '',
  message = '',
  onClose = () => {},
  onCustom = () => {},
}: AlertDialogProps): React.JSX.Element => {
  const [imgIndex, setImgIndex] = useState(0);

  const renderMessage = () => {
    if (displayImages) {
      return <img className={imgClass} src={images[imgIndex]} />;
    }

    // Pre-existing pattern: message is already sanitized before reaching this component
    return typeof message === 'string' ? (
      <pre className="message" dangerouslySetInnerHTML={{ __html: message }} />
    ) : (
      <pre className="message">{message}</pre>
    );
  };

  const renderCheckbox = () => {
    if (!checkbox) {
      return null;
    }

    const handleCheckboxClick = (e) => {
      if (e.target.checked) {
        buttons[0].onClick = () => {
          checkedCallback();
          onClose();
        };
      } else {
        buttons[0].onClick = () => {
          onClose();
        };
      }
    };

    return (
      <div className="modal-checkbox">
        <input onClick={handleCheckboxClick} type="checkbox" />
        {checkbox}
      </div>
    );
  };

  const renderButtons = () => {
    if (displayImages) {
      if (imgIndex < images.length - 1) {
        return (
          <ButtonGroup
            buttons={[
              {
                label: lang.next,
                onClick: () => {
                  setImgIndex(imgIndex + 1);
                },
                right: true,
              },
            ]}
          />
        );
      }

      return (
        <ButtonGroup
          buttons={[
            {
              label: lang.next,
              onClick: () => {
                setImgIndex(0);
                onCustom();
                onClose();
              },
              right: true,
            },
          ]}
        />
      );
    }

    return <ButtonGroup buttons={buttons} />;
  };

  const captionEl = caption !== '' ? <h2 className="caption">{caption}</h2> : '';
  const bodyClassName = displayImages ? `modal-alert ${imgClass}` : 'modal-alert';

  return (
    <div className={bodyClassName}>
      {captionEl}
      {renderMessage()}
      {renderCheckbox()}
      {renderButtons()}
    </div>
  );
};

export default AlertDialog;
