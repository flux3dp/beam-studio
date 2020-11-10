# Beam Studio
---

## Introduction

Beam Studio is the companion application for [FLUX Beam Series](http://flux3dp.com). It gives creators an intuitive interface to control over every function of the machine.

## Requirement

* [Nodejs and npm](https://docs.npmjs.com/getting-started/installing-node). Current node version: v12
* FLUX Studio requires websocket api to run. Dowload the source code of [FLUXGhost](https://github.com/flux3dp/fluxghost).
* [FLUXClient](https://github.com/flux3dp/fluxclient) or [FLUXClient-dev](https://github.com/flux3dp/fluxclient-dev) (for developers)
* [FluxSVG](https://github.com/flux3dp/fluxsvg) calculate SVG when importing SVG files and exporting tasks. (for developers)
* [Beamify](https://github.com/flux3dp/beamify) convert SVG path to f-code path. (for developers)

## Install dependency

1. Install necessary node packages `$> npm i --save-dev` or `$> yarn install`, depending on your packages manager.

## Build javascript/css resources

1. Build resource `$> gulp dev`

## Rebuild module for electron `$> node_modules/.bin/electron-rebuild`
* Rebuild C++ module to make it compatible with the node inside of electron.
* Though the module was build when running yarn install (or npm install, npm rebuild), it was build for node in your command line environment, not for electron


## Run electron

* Run default: `npm start`
* Support environment variables


## License

* AGPLv3
