function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!views/beambox/Zoom-Block/contexts/Zoom-Block-Context', 'app/actions/beambox/constant', 'app/constants/macOS-Window-Size', 'helpers/i18n'], function ({
  ZoomBlockContext
}, Constant, macOSWindowSize, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.zoom_block;

  const util = require('util');

  const child_process = require('child_process');

  const exec = util.promisify(child_process.exec);
  const ret = {};

  class ZoomBlock extends React.Component {
    constructor() {
      super();

      _defineProperty(this, "getDpmm", async () => {
        try {
          if (process.platform === 'darwin') {
            const res = await exec('/usr/sbin/system_profiler SPHardwareDataType | grep Identifier');

            if (!res.stderr) {
              const match = res.stdout.match(/(?<=Model Identifier: ).+\b/);

              if (match) {
                const modelId = match[0];
                const monitorSize = macOSWindowSize[modelId];

                if (monitorSize) {
                  const dpi = Math.hypot(screen.width, screen.height) / monitorSize;
                  const dpmm = dpi / 25.4;
                  this.setState({
                    dpmm
                  });
                  return;
                }
              }
            }
          } else if (process.platform === 'win32') {
            const res = await exec('powershell "Get-WmiObject -Namespace root\\wmi -Class WmiMonitorBasicDisplayParams"');

            if (!res.stderr) {
              const matchWidth = res.stdout.match(/(?<=MaxHorizontalImageSize[\ ]*: )\d+\b/);
              const matchHeight = res.stdout.match(/(?<=MaxVerticalImageSize[\ ]*: )\d+\b/);

              if (matchWidth && matchHeight) {
                const width = Number(matchWidth);
                const height = Number(matchHeight);

                if (!isNaN(width) && !isNaN(height)) {
                  const dpmm = (screen.width / (width * 10) + screen.height / (height * 10)) / 2;
                  this.setState({
                    dpmm
                  });
                  return;
                }
              } else if (matchWidth) {
                const width = Number(matchWidth);

                if (!isNaN(width)) {
                  const dpmm = screen.width / (width * 10);
                  this.setState({
                    dpmm
                  });
                  return;
                }
              } else if (matchHeight) {
                const height = Number(matchHeight);

                if (!isNaN(height)) {
                  const dpmm = screen.height / (height * 10);
                  this.setState({
                    dpmm
                  });
                  return;
                }
              }
            }
          } else if (process.platform === 'linux') {
            const res = await exec('xrandr | grep \' connected\'');

            if (!res.stderr) {
              const matches = res.stdout.match(/\d+x\d+\+\d+\+\d+ \d+mm x \d+mm\b/g);

              if (matches && matches.length > 0) {
                for (let i = 0; i < matches.length; i++) {
                  const match = matches[i].match(/(\d+)x(\d+)\+\d+\+\d+ (\d+)mm x (\d+)mm\b/);

                  if (match) {
                    const [q, resW, resH, width, height] = match;

                    if (Number(resW) === screen.width && Number(resH) === screen.height && width > 0 && height > 0) {
                      const dpmm = (screen.width / width + screen.height / height) / 2;
                      this.setState({
                        dpmm
                      });
                      return;
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
        }

        const dpmm = 96 / 25.4;
        this.setState({
          dpmm
        });
      });

      _defineProperty(this, "setRatio", ratio => {
        const {
          dpmm
        } = this.state;
        ratio /= 100;
        const targetZoom = ratio * dpmm / Constant.dpmm;
        svgEditor.zoomChanged(window, {
          zoomLevel: targetZoom
        });
      });

      _defineProperty(this, "zoomIn", currentRatio => {
        const ratioInPercent = Math.round(currentRatio * 100);
        let targetRatio;

        if (ratioInPercent < 500) {
          targetRatio = ratioInPercent + (10 - ratioInPercent % 10 || 10);
        } else {
          targetRatio = ratioInPercent + (100 - ratioInPercent % 100 || 100);
        }

        this.setRatio(targetRatio);
      });

      _defineProperty(this, "zoomOut", currentRatio => {
        const ratioInPercent = Math.round(currentRatio * 100);
        let targetRatio;

        if (ratioInPercent <= 500) {
          targetRatio = ratioInPercent - (ratioInPercent % 10 || 10);
        } else {
          targetRatio = ratioInPercent - (ratioInPercent % 100 || 100);
        }

        this.setRatio(targetRatio);
      });

      this.state = {
        dpmm: 96 / 25.4
      };
    }

    componentDidMount() {
      ret.contextCaller = this.context;
      this.getDpmm();
    }

    componentWillUnmount() {}

    calculatCurrentRatio() {
      const {
        dpmm
      } = this.state;

      if (!window.svgCanvas || !dpmm) {
        return 1;
      }

      const ratio = svgCanvas.getZoom() * Constant.dpmm / dpmm;
      return ratio;
    }

    render() {
      const ratio = this.calculatCurrentRatio();
      const ratioInPercent = Math.round(ratio * 100);

      const {
        ContextMenu,
        MenuItem,
        ContextMenuTrigger
      } = require('react-contextmenu');

      return /*#__PURE__*/React.createElement("div", {
        className: "zoom-block"
      }, /*#__PURE__*/React.createElement(ContextMenuTrigger, {
        id: "zoom-block-contextmenu",
        holdToDisplay: -1
      }, /*#__PURE__*/React.createElement("div", {
        className: "zoom-btn zoom-out",
        onClick: () => this.zoomOut(ratio)
      }, /*#__PURE__*/React.createElement("div", {
        className: "bar bar1"
      })), /*#__PURE__*/React.createElement(ContextMenuTrigger, {
        id: "zoom-block-contextmenu",
        holdToDisplay: 0
      }, /*#__PURE__*/React.createElement("div", {
        className: "zoom-ratio"
      }, `${ratioInPercent}%`)), /*#__PURE__*/React.createElement("div", {
        className: "zoom-btn zoom-in",
        onClick: () => this.zoomIn(ratio)
      }, /*#__PURE__*/React.createElement("div", {
        className: "bar bar1"
      }), /*#__PURE__*/React.createElement("div", {
        className: "bar bar2"
      }))), /*#__PURE__*/React.createElement(ContextMenu, {
        id: "zoom-block-contextmenu"
      }, /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => svgEditor.resetView()
      }, LANG.fit_to_window), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => this.setRatio(25)
      }, '25 %'), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => this.setRatio(50)
      }, '50 %'), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => this.setRatio(75)
      }, '75 %'), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => this.setRatio(100)
      }, '100 %'), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => this.setRatio(150)
      }, '150 %'), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: () => this.setRatio(200)
      }, '200 %')));
    }

  }

  ZoomBlock.contextType = ZoomBlockContext;
  ret.ZoomBlock = ZoomBlock;
  return ret;
});