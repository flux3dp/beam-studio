import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';

import AlertsAndProgress from 'app/views/dialogs/AlertAndProgress';
import appSettings from 'app/app-settings';
import Backbone from 'backbone';
import Beambox from 'app/pages/Beambox';
import ConnectEthernet from 'app/pages/Connect-Ethernet';
import ConnectMachineIp from 'app/pages/Connect-Machine-Ip';
import ConnectWiFi from 'app/pages/Connect-Wi-Fi';
import ConnectWired from 'app/pages/Connect-Wired';
import Dialog from 'app/views/dialogs/Dialog';
import FluxIdLogin from 'app/pages/FluxIdLogin';
import i18n from 'helpers/i18n';
import SelectConnectionType from 'app/pages/Select-Connection-Type';
import SelectMachineType from 'app/pages/Select-Machine-Type';
import Settings from 'app/pages/Settings';
import SkipConnectMachine from 'app/pages/Skip-Connect-Machine';
import { AlertProgressContextProvider } from 'app/contexts/AlertProgressContext';
import { DialogContextProvider } from 'app/contexts/DialogContext';

import Home from './Home';

const display = function (view: Function, args?, el?) {
  el = el || $('section.content')[0];
  args = args || {};
  args.props = args.props || {};
  args.state = args.state || {};

  args.state.lang = i18n.lang;
  // Shpuldn;t pass props and state using args.
  const elem = view(args);
  const component = React.createElement(elem, args.props);
  const wrappedComponent = (
    <AlertProgressContextProvider>
      <DialogContextProvider>
        {component}
        <Dialog />
        <AlertsAndProgress />
      </DialogContextProvider>
    </AlertProgressContextProvider>
  );
  ReactDOM.render(wrappedComponent, el);
};

export default Backbone.Router.extend({
  routes: {},

  initialize: function () {
    var router = this,
      routes = [
        // catch no match route, 404
        [/^.*$/, 'e404', this.e404],
        // initialize Flux Printer
        [
          /^initialize\/connect\/?(flux-id-login|select-machine-type|select-connection-type|skip-connect-machine|connect-wi-fi|connect-wired|connect-ethernet|connect-machine-ip)\/?(.*)?/,
          'initial',
          this.initial
        ],
        // go to studio
        [
          /^studio\/?(print|beambox|laser|scan|usb|settings|draw|cut|mill|cloud)\/?(.*)?/,
          'studio',
          this.studio
        ],
        // flux home
        [/^$/, 'home', this.home]
      ];

    routes.forEach(function (route) {
      router.route.apply(router, route);
    });
  },

  home: function (name) {
    display(Home, {
      props: {
        supported_langs: appSettings.i18n.supported_langs
      }
    });
  },

  initial: function (step, other) {
    switch (step) {
      case 'flux-id-login':
        display(FluxIdLogin);
        break;
      case 'select-machine-type':
        display(
          SelectMachineType,
          {
            props: {
              other,
            }
          }
        );
        break;
      case 'select-connection-type':
        display(
          SelectConnectionType,
          {
            props: {
              other,
            }
          }
        );
        break;
      case 'skip-connect-machine':
        display(
          SkipConnectMachine,
          {
            props: {
              other,
            }
          }
        )
        break;
      case 'connect-wi-fi':
        display(
          ConnectWiFi,
          {
            props: {
              other,
            }
          }
        )
        break;
      case 'connect-wired':
        display(
          ConnectWired,
          {
            props: {
              other,
            }
          }
        )
        break;
      case 'connect-ethernet':
        display(
          ConnectEthernet,
          {
            props: {
              other,
            }
          }
        )
        break;
      case 'connect-machine-ip':
        display(
          ConnectMachineIp,
          {
            props: {
              other,
            }
          }
        )
        break;
    }
  },

  studio: function (page, args) {
    args = args || '';

    var requests = args.split('/'),
      child_view = requests.splice(0, 1)[0],
      // if something needs webgl then add to the list below
      needWebGL = appSettings.needWebGL,
      map = {
        beambox: this.beambox,
        settings: this.settings,
        usb: this.usb,
        device: this.device
      },
      func = this.beambox;

    if (true === map.hasOwnProperty(page)) {
      func = map[page];
    }

    func(child_view, requests);
  },

  beambox: function () {
    display(Beambox);
  },

  settings: function (child, requests) {
    child = (child || 'general').toLowerCase();

    var childView,
      args = {
        child: child,
        requests: requests
      };

    display(Settings, args);
  },

  e404: function () {
    // TODO: handle 404
    alert('404');
  }
});
