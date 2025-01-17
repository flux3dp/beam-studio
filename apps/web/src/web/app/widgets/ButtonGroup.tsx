/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import classNames from 'classnames';

import { IButton } from 'interfaces/IButton';

interface Props {
  className?: string;
  buttons: IButton[];
}

function ButtonGroup({ buttons = [], className = '' }: Props): JSX.Element {
  if (buttons.length <= 0) {
    return (<span />);
  }

  const buttonsElems = buttons.map((opt: IButton, i: number) => {
    const type = opt.type || 'button';

    const attrs = {};
    if (opt.dataAttrs) {
      const keys = Object.keys(opt.dataAttrs);
      for (let j = 0; j < keys.length; j += 1) {
        const key = keys[i];
        if (!attrs[`data-${key}`]) {
          attrs[`data-${key}`] = opt.dataAttrs[key];
        }
      }
    }

    const hasOptClassname = typeof opt.className === 'string' && opt.className !== '';
    const btnClassName = classNames('btn', hasOptClassname ? opt.className : 'btn-default', {
      'pull-right': opt.right,
    });

    if (typeof opt.label === 'string') {
      attrs['data-test-key'] = opt.label.toLowerCase();
    }

    if (type === 'link') {
      return (
        <a
          className={btnClassName}
          key={i}
          href={opt.href}
          {...attrs}
          onClick={opt.onClick}
        >
          {opt.label}
        </a>
      );
    } if (type === 'icon') {
      return (
        <button
          key={i}
          title={opt.title}
          className={btnClassName}
          type="button"
          onClick={opt.onClick}
          {...attrs}
        >
          {opt.label}
        </button>
      );
    }
    return (
      <button
        key={i}
        title={opt.title}
        className={btnClassName}
        type="button"
        onClick={opt.onClick}
        onMouseDown={opt.onMouseDown}
        onMouseUp={opt.onMouseUp}
        onMouseLeave={opt.onMouseLeave}
        dangerouslySetInnerHTML={{ __html: opt.label }}
        {...attrs}
      />
    );
  }, this);

  const hasClassName = typeof className === 'string' && className !== '';
  const groupClassName = classNames('button-group', hasClassName ? className : 'btn-h-group');
  return (<div className={groupClassName}>{buttonsElems}</div>);
}

export default ButtonGroup;
