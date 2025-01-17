import React from 'react';

interface Props {
  status: string,
  progress: string,
}

function MonitorInfo({ status, progress }: Props): JSX.Element {
  return (
    <div className="wrapper">
      <div className="row">
        <div className="status right">
          {status}
        </div>
      </div>
      <div className="row">
        <div className="time-left right">{progress}</div>
      </div>
    </div>
  );
}

export default MonitorInfo;
