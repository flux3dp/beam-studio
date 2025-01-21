import React, { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import type { OpenDialogProperties } from '@core/interfaces/IDialog';

import dialog from '@app/implementations/dialog';
import fs from '@app/implementations/fileSystem';

import styles from './PathInput.module.scss';

export enum InputType {
  BOTH = 2,
  FILE = 0,
  FOLDER = 1,
}

const propertiesMap = {
  0: ['openFile'],
  1: ['openDirectory', 'createDirectory', 'promptToCreate'],
  2: ['openFile', 'openDirectory', 'createDirectory', 'promptToCreate'],
};

interface Props {
  buttonTitle: string;
  className?: string;
  defaultValue: string;
  forceValidValue?: boolean;
  getValue: (val: string, isValid: boolean) => void;
  type: InputType;
}

const PathInput = ({
  buttonTitle,
  className,
  defaultValue = '',
  forceValidValue = true,
  getValue,
  type,
}: Props): JSX.Element => {
  const [displayValue, setDisplayValue] = useState(defaultValue);
  const [savedValue, setSavedValue] = useState(defaultValue);
  const inputEl = useRef(null);

  useEffect(() => {
    setDisplayValue(defaultValue);
    setSavedValue(defaultValue);
  }, [defaultValue]);

  const validateValue = (val: string) => {
    if (fs.exists(val)) {
      if (type === InputType.BOTH) {
        return true;
      }

      return (
        (type === InputType.FILE && fs.isFile(val)) ||
        (type === InputType.FOLDER && fs.isDirectory(val))
      );
    }

    return false;
  };

  const updateValue = () => {
    const isValid = validateValue(displayValue);

    if (!forceValidValue || isValid) {
      if (displayValue !== savedValue) {
        setSavedValue(displayValue);
        getValue(displayValue, isValid);
      }
    } else {
      setDisplayValue(savedValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;

    setDisplayValue(target.value);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // backspace somehow does not trigger onchange event
    const target = e.target as HTMLInputElement;

    if (target.value !== displayValue) {
      setDisplayValue(target.value);
    }
  };

  const setValueFromDialog = async () => {
    const properties = propertiesMap[type] as OpenDialogProperties[];
    const option = {
      defaultPath: savedValue,
      properties,
    };
    const { canceled, filePaths } = await dialog.showOpenDialog(option);

    if (!canceled) {
      const isValid = validateValue(filePaths[0]);

      if (!forceValidValue || isValid) {
        setSavedValue(filePaths[0]);
        setDisplayValue(filePaths[0]);
        getValue(filePaths[0], isValid);
      }
    }
  };

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.btn} onClick={setValueFromDialog} title={buttonTitle}>
        <img src="img/right-panel/icon-import.svg" />
      </div>
      <input
        id="location-input"
        onBlur={updateValue}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        ref={inputEl}
        type="text"
        value={displayValue}
      />
    </div>
  );
};

export default PathInput;
