import React, { useContext, useEffect, useRef } from 'react';

import Alert from 'app/views/dialogs/Alert';
import browser from 'implementations/browser';
import NonStopProgress from 'app/views/dialogs/NonStopProgress';
import Progress from 'app/views/dialogs/Progress';
import ProgressConstants from 'app/constants/progress-constants';
import { AlertProgressContext } from 'app/contexts/AlertProgressContext';
import { IAlert } from 'interfaces/IAlert';
import { IProgressDialog } from 'interfaces/IProgress';

const isProgress = (d: IAlert | IProgressDialog): d is IProgressDialog => d.isProgress;

const AlertsAndProgress = (): JSX.Element => {
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
  if (alertProgressStack.length === 0) return <div />;

  const alertModals = alertProgressStack.map((data) => {
    if (isProgress(data)) {
      if (data.type === ProgressConstants.NONSTOP) {
        return <NonStopProgress key={`${data.key}-${data.id}`} data={data} />
      }
      return <Progress key={`${data.key}-${data.id}`} data={data} />;
    }

    return <Alert key={`${data.key}-${data.id}`} data={data} />;
  });

  return <div>{alertModals}</div>;
};

export default AlertsAndProgress;
