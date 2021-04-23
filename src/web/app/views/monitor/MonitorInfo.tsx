const React = requireNode('react');

interface Props {
  status: string;
  progress: string;
}

export default function MonitorInfo({ status, progress }: Props) {
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
