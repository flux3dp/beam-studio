requirejs.config({
    urlArgs: 'v=' + (Boolean(localStorage.dev) ? '' : (+new Date())),
    baseUrl: 'js/dist',
    waitSeconds: 30,
    paths: {
        //jquery: 'lib/jquery-1.11.0.min',
        main: 'main',
        jquery: '../lib/svgeditor/jquery',
        backbone: '../lib/backbone',
        underscore: '../lib/underscore',
        react: (Boolean(localStorage.dev) ? '../lib/react/react' : '../lib/react/react.min'),
        reactDOM: (Boolean(localStorage.dev) ? '../lib/react/react-dom' : '../lib/react/react-dom.min'),
        reactPropTypes: '../lib/react/react-proptypes',
        reactClassset: '../lib/react/react-classset',
        classNames: '../plugins/classnames/index',
        reactCreateReactClass: '../lib/react/react-create-react-class',
        svgeditor: '../lib/svgeditor',
        cropper: '../lib/cropper',
        imagetracer: '../lib/svgeditor/imagetracer',
        jsencrypt: '../lib/jsencrypt',
        cssHome: '../../css/3rd-party-plugins',
        freetrans: '../plugins/freetrans/jquery.freetrans',
        html2canvas: '../lib/html2canvas.min',
        events: '../lib/events',
        Rx: '../lib/rx.lite.min',
        Redux: '../lib/redux.min',
        reactFlux: '../lib/flux.min',
        jqueryGrowl: '..lib/jquery.growl'
    },

    map: {
        '*': {
            css: 'lib/css-loader',
            text: 'lib/text',
            domReady: 'lib/domReady',
        }
    },

    shim: {
        main: {
            deps: [
                'events',
                'Redux'
            ]
        },
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

requirejs(['main'], 
    function(Main) {
        Main();
    }
);