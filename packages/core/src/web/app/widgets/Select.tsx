// refer to: https://gist.github.com/jbottigliero/7982340,
//           https://github.com/JedWatson/react-select
import * as React from 'react';

interface Props {
  className?: string;
  defaultValue?: string | string[];
  disabled?: boolean;
  id?: string;
  multiple?: boolean;
  name?: string;
  onChange: (e: any) => void;
  options: Array<{
    data?: any;
    label: string;
    selected: boolean;
    value: number | string;
  }>;
}

function Select({
  className,
  defaultValue,
  disabled,
  id,
  multiple,
  name,
  onChange,
  options,
}: Props): React.JSX.Element {
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

          if (Array.isArray(defaultOptionValue)) {
            defaultOptionValue.push(opt.value);
          }
        } else {
          // otherwise, just set the value.
          // NOTE: this means if you pass in a list of options with
          // multiple 'selected', WITHOUT specifiying 'multiple',
          // properties the last option in the list will be the ONLY item selected.
          defaultOptionValue = defaultValue !== undefined ? defaultValue : opt.value;
        }
      }

      // attribute schema matches <option> spec; http://www.w3.org/TR/REC-html40/interact/forms.html#h-17.6
      // EXCEPT for 'key' attribute which is requested by ReactJS
      return (
        <option data-meta={metadata} key={i} label={opt.label} value={opt.value}>
          {opt.label}
        </option>
      );
    });

    return [renderedOptions, defaultOptionValue];
  };

  const [renderedOptions, defaultOptionValue] = renderOptions();

  return (
    <select
      className={className}
      defaultValue={defaultOptionValue}
      disabled={disabled}
      id={id}
      multiple={multiple}
      name={name}
      onChange={onChange}
      value={defaultOptionValue}
    >
      {renderedOptions}
    </select>
  );
}

export default Select;
