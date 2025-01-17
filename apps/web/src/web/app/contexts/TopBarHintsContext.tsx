import React from 'react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';

export const TopBarHintsContext = React.createContext<{
  hintType: string;
}>({
  hintType: null,
});

const topBarHintsEventEmitter = eventEmitterFactory.createEventEmitter('top-bar-hints');

interface State {
  hintType: string;
}

export class TopBarHintsContextProvider extends React.Component<any, State> {
  constructor(props) {
    super(props);
    this.state = {
      hintType: null,
    };
  }

  componentDidMount() {
    topBarHintsEventEmitter.on('SET_HINT', this.setHint.bind(this));
    topBarHintsEventEmitter.on('REMOVE_HINT', this.removeHint.bind(this));
  }

  componentWillUnmount() {
    topBarHintsEventEmitter.removeAllListeners();
  }

  setHint = (hintType: string): void => {
    this.setState({ hintType });
  };

  removeHint = (): void => {
    this.setState({ hintType: null });
  };

  render() {
    const { children } = this.props;
    const {
      hintType,
    } = this.state;
    return (
      <TopBarHintsContext.Provider value={{
        hintType,
      }}
      >
        {children}
      </TopBarHintsContext.Provider>
    );
  }
}
