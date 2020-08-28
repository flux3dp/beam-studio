import $ from "jquery"
import "requirejs"
// import router from "jsx/app/router"
// import announcement from "jsx/app/actions/announcement"
// import global from "app/actions/global"
// import menubar from "helpers/menubar"

require.config({
    urlArgs: 'v=' + (Boolean(localStorage.dev) ? '' : (+new Date())),
    baseUrl: 'js/',
    waitSeconds: 30,
    paths: {
        //jquery: 'lib/jquery-1.11.0.min',
        jquery: 'lib/svgeditor/jquery',
        backbone: 'lib/backbone',
        underscore: 'lib/underscore',
        react: (Boolean(localStorage.dev) ? 'lib/react/react' : 'lib/react/react.min'),
        reactDOM: (Boolean(localStorage.dev) ? 'lib/react/react-dom' : 'lib/react/react-dom.min'),
        reactPropTypes: 'lib/react/react-proptypes',
        reactClassset: 'lib/react/react-classset',
        reactCreateReactClass: 'lib/react/react-create-react-class',
        svgeditor: 'lib/svgeditor',
        threeTransformControls: 'lib/three/controls/TransformControls',
        threeOrbitControls: 'lib/three/controls/OrbitControls',
        threeTrackballControls: 'lib/three/controls/TrackballControls',
        threeSTLLoader: 'lib/three/loaders/STLLoader',
        threeOBJLoader: 'lib/three/loaders/OBJLoader',
        threeTrackball: 'lib/three/controls/TrackballControls',
        threeCircularGridHelper: 'helpers/CircularGridHelper',
        cssHome: '../css/3rd-party-plugins',
        freetrans: 'plugins/freetrans/jquery.freetrans',
        html2canvas: 'lib/html2canvas.min',
        events: 'lib/events',
        Rx: 'lib/rx.lite.min',
        Redux: 'lib/redux.min',
        threejs: 'lib/three/three.min'
    },

    map: {
        '*': {
            css: 'lib/css-loader',
            text: 'lib/text',
            domReady: 'lib/domReady',
        }
    },

    shim: {
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        jquery: {
            exports: '$'
        },
        underscore: {
            exports: '_'
        },
        threeTransformControls: {
            exports: 'TransformControls'
        },
        threeSTLLoader: {
            exports: 'STLLoader'
        },
        threeOBJLoader: {
            exports: 'OBJLoader'
        },
        freetrans: {
            deps: [
                'jquery',
                'plugins/freetrans/Matrix',
                'css!cssHome/freetrans/jquery.freetrans'
            ],
            exports: 'freetrans'
        },
        events: {
            exports: 'events'
        },
        Rx: {
            exports: 'Rx'
        },
        Redux: {
            exports: 'Redux'
        }
    }
});

const allowTracking = false;

requirejs([
    'jquery',
    'backbone',
    'app/router',
    'jsx!app/actions/announcement',
    'app/actions/global',
    'helpers/menubar'
], function($, Backbone, Router, Announcement, globalEvents, menuBar) {

    console.log(`Beam-Studio: ${"1.0.0"}`);

    if(allowTracking) {
        // google analytics
        $.getScript('/js/helpers/analytics.js');
    }

    menuBar();

    globalEvents(function() {
        let router = new Router();
        Backbone.history.start();
        Announcement.init('announcement');
    });
});
