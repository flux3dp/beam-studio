define(['jquery', 'helpers/api/cloud'], function ($, CloudApi) {
  'use strict';

  const React = require('react');

  return class SignOut extends React.Component {
    componentDidMount() {
      CloudApi.signOut().then(r => {
        location.hash = '#/studio/cloud';
      });
    }

    render() {
      return /*#__PURE__*/React.createElement("div", null);
    }

  };
});