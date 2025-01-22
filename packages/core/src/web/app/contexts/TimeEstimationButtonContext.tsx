import React from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

interface ITimeEstimationButtonContext {
  estimatedTime: null | number;
  setEstimatedTime: (estimatedTime: null | number) => void;
}

export const TimeEstimationButtonContext = React.createContext<ITimeEstimationButtonContext>({
  estimatedTime: null,
  setEstimatedTime: () => {},
});

const timeEstimationButtonEventEmitter = eventEmitterFactory.createEventEmitter('time-estimation-button');

interface State {
  estimatedTime: null | number;
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

  setEstimatedTime = (newTime: null | number): void => {
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
      <TimeEstimationButtonContext.Provider
        value={{
          estimatedTime,
          setEstimatedTime,
        }}
      >
        {children}
      </TimeEstimationButtonContext.Provider>
    );
  }
}
