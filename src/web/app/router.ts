import * as i18n from '../helpers/i18n'
import $ from 'jquery'
import Backbone from 'backbone'
import config from '../helpers/api/config'
import appSettings from './app-settings'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Beambox from './pages/Beambox'
import NotificationCollection from './views/Notification-Collection'
    const React = requireNode('react');
    const ReactDOM = requireNode('react-dom');

    const _display = function(view: Function, args?, el?) {
        el = el || $('section.content')[0];
        args = args || {};
        args.props = args.props || {};
        args.state = args.state || {};

        args.state.lang = i18n.lang;
        // Shpuldn;t pass props and state using args.
        const elem = view(args);
        const component = React.createElement(elem, args.props);
        ReactDOM.render(component, el);
    };

    export default Backbone.Router.extend({
        routes: {},

        initialize: function() {
            var router = this,
                routes = [
                    // catch no match route, 404
                    [/^.*$/, 'e404', this.e404],
                    // initialize Flux Printer
                    [
                        /^initialize\/connect\/?(select-machine-type|select-connection-type|skip-connect-machine|connect-wi-fi|connect-wired|connect-ethernet|connect-machine-ip|connect-beambox|connect-beamo|connect-machine|select|set-printer|set-password|setup-complete)\/?(.*)?/,
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

            routes.forEach(function(route) {
                router.route.apply(router, route);
            });

            this.appendNotificationCollection();
        },

        home: function(name) {
            _display(Home, {
                props: {
                    supported_langs: appSettings.i18n.supported_langs
                }
            });
        },

        initial: function(step, other) {
            var map = {
                    'select-machine-type': 'Select-Machine-Type',
                    'select-connection-type': 'Select-Connection-Type',
                    'skip-connect-machine': 'Skip-Connect-Machine',
                    'connect-wi-fi': 'Connect-Wi-Fi',
                    'connect-wired': 'Connect-Wired',
                    'connect-ethernet': 'Connect-Ethernet',
                    'connect-machine-ip': 'Connect-Machine-Ip',
                    'connect-beambox': 'Connect-Beambox',
                    'connect-beamo': 'Connect-Beamo',
                    'connect-machine': 'Connect-Machine',
                    'select': 'Wifi-Select',
                    'set-printer': 'Wifi-Set-Printer',
                    'set-password': 'Wifi-Set-Password',
                    'setup-complete': 'Wifi-Setup-Complete'
                },
                view_name = 'Wifi-Home';

            if (true === map.hasOwnProperty(step)) {
                view_name = map[step];
            }

            window['requirejs'](['jsx!pages/' + view_name], function(view) {
                _display(
                    view,
                    {
                        props: {
                            other: other
                        }
                    }
                );
            });
        },

        appendNotificationCollection: function() {
            _display(NotificationCollection, {}, $('.notification')[0]);
        },

        studio: function(page, args) {
            args = args || '';

            var requests = args.split('/'),
                child_view = requests.splice(0, 1)[0],
                // if something needs webgl then add to the list below
                needWebGL = appSettings.needWebGL,
                map = {
                    'beambox': this.beambox,
                    'settings': this.settings,
                    'usb': this.usb,
                    'device': this.device
                },
                func = this.beambox;

            if (true === map.hasOwnProperty(page)) {
                func = map[page];
            }

            func(child_view, requests);
        },

        beambox: function() {
            _display(Beambox);
        },

        settings: function(child, requests) {
            child = (child || 'general').toLowerCase();

                var childView,
                    args = {
                        child: child,
                        requests: requests
                    };

                _display(Settings, args);
        },

        e404: function() {
            // TODO: handle 404
            alert('404');
        }
    });
