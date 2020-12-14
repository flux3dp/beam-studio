requirejs.config({
    urlArgs: 'v=' + (Boolean(localStorage.dev) ? '' : (+new Date())),
    baseUrl: 'js/dist',
    waitSeconds: 30,
    paths: {
        //jquery: 'lib/jquery-1.11.0.min',
        main: 'main',
        tsLoader: 'loader',
        jquery: '../lib/svgeditor/jquery',
        backbone: '../lib/backbone',
        underscore: '../lib/underscore',
        svgeditor: '../lib/svgeditor',
        imagetracer: '../lib/svgeditor/imagetracer',
        cssHome: '../../css/3rd-party-plugins',
        freetrans: '../plugins/freetrans/jquery.freetrans',
        events: '../lib/events',
        Redux: '../lib/redux.min',
        jqueryGrowl: '../lib/jquery.growl',
        dxf2svg: '../lib/dxf2svg',
        // SVG Editor Libraries Begin
        jsHotkeys: '../lib/svgeditor/js-hotkeys/jquery.hotkeys.min',
        jquerybbq: '../lib/svgeditor/jquerybbq/jquery.bbq.min',
        svgicons: '../lib/svgeditor/svgicons/jquery.svgicons',
        jgraduate: '../lib/svgeditor/jgraduate/jquery.jgraduate.min',
        spinbtn: '../lib/svgeditor/spinbtn/JQuerySpinBtn.min',
        touch: '../lib/svgeditor/touch',
        svgedit: '../lib/svgeditor/svgedit',
        jquerySvg: '../lib/svgeditor/jquery-svg',
        jqueryContextMenu: '../lib/svgeditor/contextmenu/jquery.contextMenu',
        pathseg: '../lib/svgeditor/pathseg',
        browser: '../lib/svgeditor/browser',
        svgtransformlist: '../lib/svgeditor/svgtransformlist',
        math: '../lib/svgeditor/math',
        units: '../lib/svgeditor/units',
        svgutils: '../lib/svgeditor/svgutils',
        sanitize: '../lib/svgeditor/sanitize',
        history: '../lib/svgeditor/history',
        historyrecording: '../lib/svgeditor/historyrecording',
        coords: '../lib/svgeditor/coords',
        recalculate: '../lib/svgeditor/recalculate',
        select: '../lib/svgeditor/select',
        draw: '../lib/svgeditor/draw',
        layer: '../lib/svgeditor/layer',
        path: '../lib/svgeditor/path',
        svgcanvas: '../lib/svgeditor/svgcanvas',
        beameasyapi: '../lib/svgeditor/beam-easy-api',
        locale: '../lib/svgeditor/locale/locale',
        contextmenu: '../lib/svgeditor/contextmenu',
        clipper_unminified: '../lib/clipper_unminified',
        svgnest: '../lib/svg-nest/svgnest',
        svgnestGeoUtil: '../lib/svg-nest/util/geometryutil',
        svgnestParallel: '../lib/svg-nest/util/parallel',
        svgnestEval: '../lib/svg-nest/util/eval',
        jqueryUi: '../lib/svgeditor/jquery-ui/jquery-ui-1.8.17.custom.min',
        jpicker: '../lib/svgeditor/jgraduate/jpicker',
        canvg: '../lib/svgeditor/canvg/canvg',
        rgbcolor: '../lib/svgeditor/canvg/rgbcolor'
        // SVG Editor Libraries End
    },

    map: {
        '*': {
            css: '../lib/css-loader',
            text: '../lib/text',
            domReady: '../lib/domReady',
        }
    },

    shim: {
        tsLoader: {
            deps: [
                'svgedit'
            ]
        },
        main: {
            deps: [
                'events',
                'Redux',
                'jsHotkeys',
                'jquerybbq',
                'svgicons',
                'jgraduate',
                'spinbtn',
                'touch',
                'svgedit',
                'jquerySvg',
                'jqueryContextMenu',
                'pathseg',
                'browser',
                'svgtransformlist',
                'math',
                'units',
                'svgutils',
                'sanitize',
                'history',
                'historyrecording',
                'coords',
                'recalculate',
                'select',
                'draw',
                'layer',
                'path',
                'svgcanvas',
                'locale',
                'contextmenu',
                'clipper_unminified',
                'jqueryUi',
                'jpicker',
                'css!svgeditor/svg-editor',
                'css!svgeditor/jgraduate/css/jPicker',
                'css!svgeditor/jgraduate/css/jgraduate',
                'css!svgeditor/spinbtn/JQuerySpinBtn',
                'canvg',
                'rgbcolor'
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
        Redux: {
            exports: 'Redux'
        },
        // SVG Editor Libraries Begin (load in the same order with js/lib/svgeditor/svg-editor.html)
        jsHotkeys: {
            deps: ['jquery']
        },
        jquerybbq: {
            deps: ['jsHotkeys']
        },
        svgicons: {
            deps: ['jquerybbq']
        },
        jgraduate: {
            deps: ['svgicons']
        },
        spinbtn: {
            deps: ['jgraduate']
        },
        touch: {
            deps: ['spinbtn']
        },
        jquerySvg: {
            deps: ['touch']
        },
        jqueryContextMenu: {
            deps: ['jquerySvg']
        },
        pathseg: {
            deps: ['jqueryContextMenu']
        },
        browser: {
            deps: ['pathseg']
        },
        svgtransformlist: {
            deps: ['browser']
        },
        math: {
            deps: ['svgtransformlist']
        },
        units: {
            deps: ['math']
        },
        svgutils: {
            deps: ['units']
        },
        sanitize: {
            deps: ['svgutils']
        },
        history: {
            deps: ['sanitize']
        },
        historyrecording: {
            deps: ['history']
        },
        coords: {
            deps: ['historyrecording']
        },
        recalculate: {
            deps: ['coords']
        },
        select: {
            deps: ['recalculate']
        },
        draw: {
            deps: ['select']
        },
        layer: {
            deps: ['draw']
        },
        path: {
            deps: ['layer']
        },
        svgcanvas: {
            deps: ['path']
        },
        beameasyapi: {
            deps: ['svgcanvas']
        },
        locale: {
            deps: ['tsLoader', 'beameasyapi']
        },
        contextmenu: {
            deps: ['locale']
        },
        clipper_unminified: {
            deps: ['contextmenu']
        },
        svgnest: {
            deps: ['clipper_unminified']
        },
        svgnestGeoUtil: {
            deps: ['svgnest']
        },
        svgnestParallel: {
            deps: ['svgnestGeoUtil']
        },
        svgnestEval: {
            deps: ['svgnestParallel']
        },
        jqueryUi: {
            deps: ['svgnestEval']
        },
        jpicker: {
            deps: ['jqueryUi']
        }
        // SVG Editor Libraries End
    }
});

// Typescript Generated Functions
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};

// Load main

requirejs([
    'tsLoader',
    'main'
], 
function (tsLoader, Main) {
    //console.log("Element", Main);
    Main.default();
}
);