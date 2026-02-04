import React from 'react';

interface Props {
  progress: string;
  status: string;
}

function MonitorInfo({ progress, status }: Props): React.JSX.Element {
  return (
    <div className="wrapper">
      <div className="row">
        <div className="status right">{status}</div>
      </div>
      <div className="row">
        <div className="time-left right">{progress}</div>
      </div>
    </div>
  );
}

export default MonitorInfo;
