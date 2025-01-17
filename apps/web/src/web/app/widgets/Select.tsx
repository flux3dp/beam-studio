// refer to: https://gist.github.com/jbottigliero/7982340,
//           https://github.com/JedWatson/react-select
import * as React from 'react';

interface Props {
  id?: string;
  name?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
  options: {
    value: string | number,
    label: string,
    selected: boolean;
    data?: any;
  }[];
  defaultValue?: string | string[];
  onChange: (e: any) => void;
}

function Select({
  id, name, className, multiple, disabled, options, defaultValue, onChange,
}: Props): JSX.Element {
  const renderOptions = () => {
    let defaultOptionValue;
    const renderedOptions = options.map((opt, i) => {
      const metadata = JSON.stringify(opt.data);
      // if this is the selected option, set the <select>'s defaultValue
      if (opt.selected) {
        // if the <select> is a multiple, push the values
        // to an array
        if (multiple) {
          if (defaultOptionValue === undefined) {
            defaultOptionValue = [];
          }
          if (defaultOptionValue instanceof Array) {
            defaultOptionValue.push(opt.value);
          }
        } else {
          // otherwise, just set the value.
          // NOTE: this means if you pass in a list of options with
          // multiple 'selected', WITHOUT specifiying 'multiple',
          // properties the last option in the list will be the ONLY item selected.
          defaultOptionValue = (defaultValue !== undefined ? defaultValue : opt.value);
        }
      }
      // attribute schema matches <option> spec; http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.6
      // EXCEPT for 'key' attribute which is requested by ReactJS
      return (
        // eslint-disable-next-line react/no-array-index-key
        <option key={i} value={opt.value} label={opt.label} data-meta={metadata}>
          {opt.label}
        </option>
      );
    });

    return [renderedOptions, defaultOptionValue];
  };

  const [renderedOptions, defaultOptionValue] = renderOptions();
  return (
    <select
      disabled={disabled}
      defaultValue={defaultOptionValue}
      value={defaultOptionValue}
      multiple={multiple}
      name={name}
      id={id}
      className={className}
      onChange={onChange}
    >
      {renderedOptions}
    </select>
  );
}

export default Select;
