import React from 'react';

import classNames from 'classnames';

import type { IButton } from '@core/interfaces/IButton';

interface Props {
  buttons: IButton[];
  className?: string;
}

function ButtonGroup({ buttons = [], className = '' }: Props): React.JSX.Element {
  if (buttons.length <= 0) {
    return <span />;
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
        <a className={btnClassName} href={opt.href} key={i} {...attrs} onClick={opt.onClick}>
          {opt.label}
        </a>
      );
    }

    if (type === 'icon') {
      return (
        <button className={btnClassName} key={i} onClick={opt.onClick} title={opt.title} type="button" {...attrs}>
          {opt.label}
        </button>
      );
    }

    return (
      <button
        className={btnClassName}
        dangerouslySetInnerHTML={{ __html: opt.label }}
        key={i}
        onClick={opt.onClick}
        onMouseDown={opt.onMouseDown}
        onMouseLeave={opt.onMouseLeave}
        onMouseUp={opt.onMouseUp}
        title={opt.title}
        type="button"
        {...attrs}
      />
    );
  }, this);

  const hasClassName = typeof className === 'string' && className !== '';
  const groupClassName = classNames('button-group', hasClassName ? className : 'btn-h-group');

  return <div className={groupClassName}>{buttonsElems}</div>;
}

export default ButtonGroup;
