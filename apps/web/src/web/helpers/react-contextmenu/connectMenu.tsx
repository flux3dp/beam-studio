/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import listener from './globalEventListener';

// expect the id of the menu to be responsible for as outer parameter
export default function connectFactory(menuId) {
  // expect menu component to connect as inner parameter
  // <Child/> is presumably a wrapper of <ContextMenu/>
  return function connect(Child) {
    // return wrapper for <Child/> that forwards the ContextMenuTrigger's additional props
    return class ConnectMenu extends Component<any, { trigger: any }> {
      private listenId: string;

      constructor(props) {
        super(props);
        this.state = { trigger: null };
      }

      componentDidMount() {
        this.listenId = listener.register(this.handleShow, this.handleHide);
      }

      componentWillUnmount() {
        if (this.listenId) {
          listener.unregister(this.listenId);
        }
      }

      handleShow = (e) => {
        if (e.detail.id !== menuId) return;

        // the onShow event's detail.data object holds all ContextMenuTrigger props
        const filteredData = {};
        this.setState({ trigger: filteredData });
      };

      handleHide = () => {
        this.setState({ trigger: null });
      };

      render() {
        const { trigger } = this.state;
        return <Child {...this.props} id={menuId} trigger={trigger} />;
      }
    };
  };
}
