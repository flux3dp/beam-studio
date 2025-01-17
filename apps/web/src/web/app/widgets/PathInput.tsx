import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import dialog from 'implementations/dialog';
import fs from 'implementations/fileSystem';
import { OpenDialogProperties } from 'interfaces/IDialog';

import styles from './PathInput.module.scss';

export enum InputType {
  FILE = 0,
  FOLDER = 1,
  BOTH = 2,
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
  type: InputType;
  getValue: (val: string, isValid: boolean) => void;
}

const PathInput = ({
  buttonTitle,
  className,
  defaultValue = '',
  getValue,
  forceValidValue = true,
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
      if (type === InputType.BOTH) return true;
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
      properties,
      defaultPath: savedValue,
    };
    const { filePaths, canceled } = await dialog.showOpenDialog(option);
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
      <div className={styles.btn} title={buttonTitle} onClick={setValueFromDialog}>
        <img src="img/right-panel/icon-import.svg" />
      </div>
      <input
        id="location-input"
        type="text"
        value={displayValue}
        onBlur={updateValue}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        ref={inputEl}
      />
    </div>
  );
};

export default PathInput;
