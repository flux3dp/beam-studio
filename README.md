# Beam Studio

---

## Introduction

Beam Studio is the companion application for [FLUX Beam Series](http://flux3dp.com). It gives creators an intuitive interface to control over every function of the machine.

## Requirement

* [Nodejs and npm](https://docs.npmjs.com/getting-started/installing-node). Current node version: v22.13
* Beam Studio requires websocket api to run. Dowload the source code of [FLUXGhost](https://github.com/flux3dp/fluxghost).
* [FLUXClient](https://github.com/flux3dp/fluxclient) or [FLUXClient-dev](https://github.com/flux3dp/fluxclient-dev) (for developers)
* [FluxSVG](https://github.com/flux3dp/fluxsvg) calculate SVG when importing SVG files and exporting tasks. (for developers)
* [Beamify](https://github.com/flux3dp/beamify) convert SVG path to f-code path. (for developers)

## Install dependency

1. Install pnpm
2. Install necessary node packages `$> pnpm install`, depending on your packages manager.

## Run Electron

1. Build resource `$> pnpm run app:dev` or `$> pnpm nx run app:dev`
2. Run electron `$> pnpm run app:start` or `$> pnpm nx run app:start`

## Run Develop Web App

1. Run webpack dev server: `$> pnpm run web:start` or `$> pnpm nx run web:start`

## License

* AGPLv3
