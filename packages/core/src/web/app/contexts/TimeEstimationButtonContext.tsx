import React from 'react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';

interface ITimeEstimationButtonContext {
  estimatedTime: number | null;
  setEstimatedTime: (estimatedTime: number | null) => void;
}

export const TimeEstimationButtonContext = React.createContext<ITimeEstimationButtonContext>({
  estimatedTime: null,
  setEstimatedTime: () => { },
});

const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

interface State {
  estimatedTime: number | null;
}

export class TimeEstimationButtonContextProvider extends React.Component<any, State> {
  constructor(props) {
    super(props);
    this.state = {
      estimatedTime: null,
    };
  }

  componentDidMount() {
    timeEstimationButtonEventEmitter.on('SET_ESTIMATED_TIME', this.setEstimatedTime.bind(this));
  }

  componentWillUnmount() {
    timeEstimationButtonEventEmitter.removeAllListeners();
  }

  setEstimatedTime = (newTime: number | null): void => {
    const { estimatedTime } = this.state;
    if (newTime !== estimatedTime) {
      this.setState({ estimatedTime: newTime });
    }
  };

  render() {
    const { setEstimatedTime } = this;
    const { estimatedTime } = this.state;
    const { children } = this.props;
    return (
      <TimeEstimationButtonContext.Provider value={{
        setEstimatedTime,
        estimatedTime,
      }}
      >
        {children}
      </TimeEstimationButtonContext.Provider>
    );
  }
}
