define([
    'jsx!views/beambox/Right-Panels/Laser-Panel',
    'reactCreateReactClass'
], function(
    LaserPanel
){
    const React = require('react');
    const ReactDOM = require('react-dom');

    const _defaultConfig = {
        configName: '',
        speed: 20,
        strength: 15,
        repeat: 1,
        af: 0,
        zstep: 0,
        height: -3,
        diode: 0
    }

    const _tracedImageConfig = {
        configName: '',
        speed: 200,
        strength: 20,
        repeat: 1,
        height: 0,
        af: 0,
        zstep: 0,
        diode: 0
    }

    const _tracedPathConfig = {
        configName: '',
        speed: 5,
        strength: 70,
        repeat: 1,
        height: 0,
        af: 0,
        zstep: 0,
        diode: 0
    }

    const _getConfig = function(name) {
        switch (name) {
            case 'Traced Image':
                return _tracedImageConfig;
            case 'Traced Path':
                return _tracedPathConfig;
            default:
                return _defaultConfig;
        }
    }

    const _getLayer = function(name) {
        const layer = $('#svgcontent').find('g.layer').filter(function(){
            return $(this).find('title').text() === name;
        });
        return layer;
    }
    const _getData = function(name, attr) {
        let val = _getLayer(name).attr('data-' + attr);
        val = val || _writeData(name, attr, _getConfig(name)[attr]);
        return val;
    }
    const _writeData = function(name, attr, val) {
        return _getLayer(name).attr('data-' + attr, val);
    }

    const _getSpeed = function(name) {
        return _getData(name, 'speed');
    }

    const _getStrength = function(name) {
        return _getData(name, 'strength');
    }

    const _getRepeat = function(name) {
        return _getData(name, 'repeat');
    }

    const _getHeight = function(name) {
        return _getData(name, 'height');
    }

    const _getDiode = function(name) {
        return _getData(name, 'diode');
    }

    const _getAutofocus = function(name) {
        return _getData(name, 'af');
    }

    const _getZStep = function(name) {
        return _getData(name, 'zstep');
    }

    const getConfigName = function(name) {
        return _getData(name, 'configName');
    }

    const resetConfigName = function(name) {
        return _writeData(nane, '', val);
    }

    const writeSpeed = function(name, val) {
        return _writeData(name, 'speed', val);
    }

    const writeStrength = function(name, val) {
        return _writeData(name, 'strength', val);
    }

    const writeRepeat = function(name, val) {
        return _writeData(name, 'repeat', val);
    }

    const writeHeight = function(name, val) {
        return _writeData(name, 'height', val);
    }

    const writeDiode = function(name, val) {
        return _writeData(name, 'diode', val);
    }

    const writeAutofocus = function(name, val) {
        return _writeData(name, 'af', val);
    }

    const writeZStep = function(name, val) {
        return _writeData(name, 'zstep', val);
    }

    const writeConfigName = function(name, val) {
        return _writeData(name, 'configName', val);
    }

    class LaserPanelController {
        constructor() {
            this.reactRoot = '';
            this.funcs = {
                writeSpeed: writeSpeed,
                writeStrength: writeStrength,
                writeRepeat: writeRepeat,
                writeHeight: writeHeight,
                writeDiode: writeDiode,
                writeZStep: writeZStep,
                writeConfigName: writeConfigName
            }
        }
        init(reactRoot) {
            this.reactRoot = reactRoot;
        }

        initConfig(name) {
            _getSpeed(name, _getConfig(name).speed);
            _getStrength(name, _getConfig(name).strength);
            _getRepeat(name, _getConfig(name).repeat);
            _getHeight(name, _getConfig(name).height);
            _getDiode(name, _getConfig(name).diode);
            _getZStep(name, _getConfig(name).zstep);
        }

        cloneConfig(name, baseName) {
            writeSpeed(name, _getSpeed(baseName));
            writeStrength(name, _getStrength(baseName));
            writeRepeat(name, _getRepeat(baseName));
            writeHeight(name, _getHeight(baseName));
            writeDiode(name, _getDiode(baseName));
            writeZStep(name, _getZStep(baseName));
            writeConfigName(name, getConfigName(baseName));
        }

        render(name) {
            if (_getLayer(name).length < 1) {
                return;
            }

            const speed = _getSpeed(name);
            const strength = _getStrength(name);
            const repeat = _getRepeat(name);
            const height = _getHeight(name);
            const isDiode = _getDiode(name);
            const zStep = _getZStep(name);
            const configName = getConfigName(name);

            if (!document.getElementById(this.reactRoot)) {
                return;
            }

            ReactDOM.render(
                <LaserPanel
                    configName={configName}
                    layerName={name}
                    speed={speed}
                    strength={strength}
                    repeat={repeat}
                    height={height}
                    zStep={zStep}
                    isDiode={isDiode}
                    funcs={this.funcs}
                />
                ,document.getElementById(this.reactRoot)
            );
        }
    }

    const instance = new LaserPanelController();

    return instance;
});
