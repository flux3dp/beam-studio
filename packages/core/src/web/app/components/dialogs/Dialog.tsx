import * as React from 'react';

import classNames from 'classnames';

import { DialogContext } from '@core/app/contexts/DialogContext';

const ComponentWrapper = (props) => props.children;

interface Props {
  className?: string;
}

const Dialog = ({ className = '' }: Props): React.JSX.Element => {
  const { dialogComponents } = React.use(DialogContext);
  const renderComponents = () => {
    const components = [];

    for (let i = 0; i < dialogComponents.length; i += 1) {
      const { component } = dialogComponents[i];

      components.push(<ComponentWrapper key={i}>{component}</ComponentWrapper>);
    }

    return components;
  };

  return <div className={classNames('dialog-container', className)}>{renderComponents()}</div>;
};

export default Dialog;
