import React, { useContext, useEffect, useRef } from 'react';

import { AlertProgressContext } from '@core/app/contexts/AlertProgressContext';
import Alert from '@core/app/views/dialogs/Alert';
import NonStopProgress from '@core/app/views/dialogs/NonStopProgress';
import Progress from '@core/app/views/dialogs/Progress';
import browser from '@core/implementations/browser';
import type { IAlert } from '@core/interfaces/IAlert';
import { type IProgressDialog, ProgressTypes } from '@core/interfaces/IProgress';

const isProgress = (d: IAlert | IProgressDialog): d is IProgressDialog => Boolean(d.isProgress);

const AlertsAndProgress = (): React.JSX.Element => {
  const messageRef = useRef<HTMLPreElement>();

  const { alertProgressStack } = useContext(AlertProgressContext);

  useEffect(() => {
    const message = messageRef.current as Element;

    if (message) {
      const aElements = message.querySelectorAll('a');

      for (let i = 0; i < aElements.length; i += 1) {
        const a = aElements[i];

        a.addEventListener('click', (e) => {
          e.preventDefault();
          browser.open(a.getAttribute('href'));
        });
      }
    }
  });

  if (alertProgressStack.length === 0) {
    return <div />;
  }

  const alertModals = alertProgressStack.map((data) => {
    if (isProgress(data)) {
      if (data.type === ProgressTypes.NONSTOP) {
        return <NonStopProgress data={data} key={`${data.key}-${data.id}`} />;
      }

      return <Progress data={data} key={`${data.key}-${data.id}`} />;
    }

    return <Alert data={data} key={`${data.key}-${data.id}`} />;
  });

  return <div>{alertModals}</div>;
};

export default AlertsAndProgress;
