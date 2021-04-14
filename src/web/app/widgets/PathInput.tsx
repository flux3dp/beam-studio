import electronDialogs from 'app/actions/electron-dialogs';
import { IFileFilter } from 'interfaces/IElectron';

const classNames = requireNode('classnames');
const React = requireNode('react');
const fs = requireNode('fs');
const fsPromises = fs.promises;

const { useEffect, useRef, useState } = React;

export enum InputType {
  FILE = 0,
  FOLDER = 1,
  BOTH = 2,
};

const propertiesMap = {
  0: ['openFile',],
  1: ['openDirectory', 'createDirectory', 'promptToCreate'],
  2: ['openFile', 'openDirectory', 'createDirectory', 'promptToCreate'],
}

interface IProps {
  buttonTitle?: string,
  className?: string
  defaultValue: string,
  getValue: Function,
  forceValidValue?: boolean,
  onBlur?: Function,
  type: InputType,
  filters?: IFileFilter[],
};

const PathInput = ({ buttonTitle, className, defaultValue, getValue, forceValidValue = true, onBlur, type = InputType.FILE, filters, }: IProps) => {
  const [displayValue, setDisplayValue] = useState(defaultValue);
  const [savedValue, setSavedValue] = useState(defaultValue);
  const inputEl = useRef(null);
  useEffect(() => {
    setDisplayValue(defaultValue);
    setSavedValue(defaultValue);
  }, [defaultValue]);

  const handleBlur = (e) => {
    updateValue();
    if (onBlur) {
      onBlur();
    }
  };
  const handleChange = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    setDisplayValue(target.value);
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    // backspace somehow does not trigger onchange event
    const target = e.target as HTMLInputElement;
    if (target.value !== displayValue) {
      setDisplayValue(target.value);
    }
  }

  const validateValue = (val: string) => {
    if (fs.existsSync(val)) {
      if (type === InputType.BOTH) return true;
      const stat = fs.lstatSync(val);
      return (type === InputType.FILE && stat.isFile()) || (type === InputType.FOLDER && stat.isDirectory());
    }
    return false;
  }

  const updateValue = () => {
    const isValid = validateValue(displayValue);
    if (!forceValidValue || isValid) {
      if (displayValue !== savedValue) {
        setSavedValue(displayValue);
        if (getValue) {
          getValue(displayValue, isValid);
        }
      }
    } else {
      setDisplayValue(savedValue);
    }
  }

  const setValueFromDialog = async () => {
    const properties = propertiesMap[type];
    const option = {
      properties,
      filters,
      defaultPath: savedValue,
    };
    const { filePaths, canceled } = await electronDialogs.showOpenDialog(option);
    if (!canceled) {
      const isValid = validateValue(filePaths[0]);
      if (!forceValidValue || isValid) {
        setSavedValue(filePaths[0]);
        setDisplayValue(filePaths[0]);
        if (getValue) {
          getValue(filePaths[0], isValid);
        }
      }
    }
  }

  const openDialogButton = (
    <div className='dialog-btn' title={buttonTitle} onClick={setValueFromDialog}>
      <img src={'img/right-panel/icon-import.svg'} />
    </div>
  );

  return (
    <div className={classNames('path-input', className)}>
      <input
        type='text'
        value={displayValue}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        ref={inputEl}
      />
      {openDialogButton}
    </div>
  );
}

export default PathInput;