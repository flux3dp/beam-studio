function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!views/beambox/Right-Panels/contexts/LayerPanelContext', 'jsx!app/actions/beambox/Laser-Panel-Controller', 'jsx!app/views/beambox/Color-Picker-Panel', 'jsx!contexts/DialogCaller', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'jsx!views/tutorials/Tutorial-Controller', 'jsx!constants/tutorial-constants', 'helpers/i18n'], function ({
  LayerPanelContext
}, LaserPanelController, ColorPickerPanel, DialogCaller, Alert, AlertConstants, TutorialController, TutorialConstants, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.right_panel.layer_panel;
  let ret = {};

  class LayerPanel extends React.Component {
    constructor() {
      super();

      _defineProperty(this, "addLayerLaserConfig", layername => {
        LaserPanelController.initConfig(layername);
      });

      _defineProperty(this, "cloneLayerLaserConfig", (oldName, newName) => {
        LaserPanelController.cloneConfig(oldName, newName);
      });

      _defineProperty(this, "renderLayerLaserConfigs", () => {
        if (window.svgCanvas) {
          const drawing = svgCanvas.getCurrentDrawing();
          const currentLayerName = drawing.getCurrentLayerName();
          LaserPanelController.render(currentLayerName);
        }
      });

      _defineProperty(this, "addNewLayer", () => {
        let i = svgCanvas.getCurrentDrawing().getNumLayers();
        let uniqName = LANG.layers.layer + ' ' + ++i;

        while (svgCanvas.getCurrentDrawing().hasLayer(uniqName)) {
          uniqName = LANG.layers.layer + ' ' + ++i;
        }

        DialogCaller.promptDialog({
          caption: LANG.notification.newName,
          defaultValue: uniqName,
          onYes: newName => {
            if (!newName) {
              return;
            }

            if (svgCanvas.getCurrentDrawing().hasLayer(newName)) {
              Alert.popUp({
                id: 'dupli layer name',
                message: LANG.notification.dupeLayerName
              });
              return;
            }

            svgCanvas.createLayer(newName);

            if (TutorialController.getNextStepRequirement() === TutorialConstants.ADD_NEW_LAYER) {
              TutorialController.handleNextStep();
            }

            window.updateContextPanel();
            this.addLayerLaserConfig(newName);
            this.setState(this.state);
          }
        });
      });

      _defineProperty(this, "cloneLayer", () => {
        const oldName = svgCanvas.getCurrentDrawing().getCurrentLayerName();
        var name = oldName + ' copy';
        DialogCaller.promptDialog({
          caption: LANG.notification.newName,
          defaultValue: name,
          onYes: newName => {
            if (!newName) {
              return;
            }

            if (svgCanvas.getCurrentDrawing().hasLayer(newName)) {
              Alert.popUp({
                id: 'dupli layer name',
                message: uiStrings.notification.dupeLayerName
              });
              return;
            }

            svgCanvas.cloneLayer(newName);
            window.updateContextPanel();
            this.cloneLayerLaserConfig(newName, oldName);
            this.setState(this.state);
          }
        });
      });

      _defineProperty(this, "deleteLayer", () => {
        if (svgCanvas.deleteCurrentLayer()) {
          window.updateContextPanel();
          this.setState(this.state);
        }
      });

      _defineProperty(this, "lockLayer", () => {
        svgCanvas.lockLayer();
        this.setState(this.state);
      });

      _defineProperty(this, "mergeLayer", () => {
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        let curIndex = drawing.getCurrentLayerPosition();

        if (curIndex === layerCount) {
          return;
        }

        svgCanvas.mergeLayer();
        window.updateContextPanel();
        this.setState(this.state);
      });

      _defineProperty(this, "mergeAllLayer", () => {
        svgCanvas.mergeAllLayers();
        window.updateContextPanel();
        this.setState(this.state);
      });

      _defineProperty(this, "renameLayer", () => {
        const drawing = svgCanvas.getCurrentDrawing();
        const oldName = drawing.getCurrentLayerName();
        DialogCaller.promptDialog({
          caption: LANG.notification.newName,
          defaultValue: '',
          onYes: newName => {
            if (!newName) {
              return;
            }

            if (oldName === newName || svgCanvas.getCurrentDrawing().hasLayer(newName)) {
              Alert.popUp({
                id: 'old_layer_name',
                message: LANG.notification.layerHasThatName
              });
              return;
            }

            svgCanvas.renameCurrentLayer(newName);
            this.cloneLayerLaserConfig(oldName, newName);
            this.setState(this.state);
          }
        });
      });

      _defineProperty(this, "moveLayerRel", pos => {
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        let curIndex = drawing.getCurrentLayerPosition();

        if (curIndex > 0 || curIndex < layerCount - 1) {
          curIndex += pos;
          svgCanvas.setCurrentLayerPosition(curIndex);
          this.setState(this.state);
        }
      });

      _defineProperty(this, "moveToOtherLayer", e => {
        const select = e.target;
        const destLayer = select.options[select.selectedIndex].value;
        const drawing = svgCanvas.getCurrentDrawing();
        const confirmStr = LANG.notification.QmoveElemsToLayer.replace('%s', destLayer);

        const moveToLayer = ok => {
          if (!ok) {
            return;
          }

          this.promptMoveLayerOnce = true;
          svgCanvas.moveSelectedToLayer(destLayer);
          drawing.setCurrentLayer(destLayer);
          this.setState(this.state);
        };

        if (destLayer) {
          if (this.promptMoveLayerOnce) {
            moveToLayer(true);
          } else {
            Alert.popUp({
              id: 'move layer',
              buttonType: AlertConstants.YES_NO,
              message: confirmStr,
              onYes: moveToLayer
            });
          }
        }
      });

      _defineProperty(this, "selectLayer", layerName => {
        svgCanvas.clearSelection();
        const drawing = svgCanvas.getCurrentDrawing();
        const res = drawing.setCurrentLayer(layerName);

        if (res) {
          this.renderLayerLaserConfigs();
          this.setState(this.state);
        }
      });

      _defineProperty(this, "highlightLayer", function (layerName) {
        let i,
            curNames = [];
        const numLayers = svgCanvas.getCurrentDrawing().getNumLayers();

        for (i = 0; i < numLayers; i++) {
          curNames[i] = svgCanvas.getCurrentDrawing().getLayerName(i);
        }

        if (layerName) {
          for (i = 0; i < numLayers; ++i) {
            if (curNames[i] !== layerName) {
              svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 0.5);
            }
          }
        } else {
          for (i = 0; i < numLayers; ++i) {
            svgCanvas.getCurrentDrawing().setLayerOpacity(curNames[i], 1.0);
          }
        }
      });

      _defineProperty(this, "setLayerVisibility", layerName => {
        const drawing = svgCanvas.getCurrentDrawing();
        const isVis = drawing.getLayerVisibility(layerName);
        svgCanvas.setLayerVisibility(layerName, !isVis);
        this.setState(this.state);
      });

      _defineProperty(this, "unLockLayer", (e, layerName) => {
        const drawing = svgCanvas.getCurrentDrawing();
        let node = e.target;

        while (node.tagName.toLowerCase() !== 'tr') {
          node = node.parentNode;
        }

        $(node).removeClass('lock');
        const layer = drawing.getLayerByName(layerName);
        svgCanvas.unlockLayer(layer);
      });

      _defineProperty(this, "openLayerColorPanel", (e, layerName) => {
        const drawing = svgCanvas.getCurrentDrawing();
        const layer = drawing.getLayerByName(layerName);
        const node = e.target;
        ColorPickerPanel.init('color_picker_placeholder', layer, $(node), () => {
          this.setState(this.state);
        });
        ColorPickerPanel.setPosition(e.clientX, e.clientY);
        ColorPickerPanel.render();
        ColorPickerPanel.renderPickr();
      });

      _defineProperty(this, "layerDragStart", (layerName, index) => {
        this.setState({
          draggingLayer: layerName,
          draggingDestIndex: index
        });
      });

      _defineProperty(this, "layerDragEnter", index => {
        const {
          draggingDestIndex
        } = this.state;

        if (draggingDestIndex !== index) {
          this.setState({
            draggingDestIndex: index
          });
        }
      });

      _defineProperty(this, "layerDragEnd", () => {
        let {
          draggingLayer,
          draggingDestIndex
        } = this.state;
        const drawing = svgCanvas.getCurrentDrawing();
        drawing.setCurrentLayer(draggingLayer);
        const layerCount = drawing.getNumLayers();
        draggingDestIndex = layerCount - draggingDestIndex - 1;
        let currentIndex = 0;

        for (currentIndex; currentIndex < layerCount; currentIndex++) {
          if (drawing.getLayerName(currentIndex) === draggingLayer) {
            break;
          }
        }

        if (currentIndex !== draggingDestIndex) {
          svgCanvas.setCurrentLayerPosition(draggingDestIndex);
        }

        this.setState({
          draggingLayer: null,
          draggingDestIndex: null
        });
      });

      _defineProperty(this, "layerDoubleClick", layerName => {
        this.renameLayer();
      });

      _defineProperty(this, "appendDraggingLayerToLayerList", layers => {
        const {
          draggingLayer
        } = this.state;
        const drawing = svgCanvas.getCurrentDrawing();
        const layer = drawing.getLayerByName(draggingLayer);
        const currentLayerName = drawing.getCurrentLayerName();
        const isLocked = layer.getAttribute('data-lock') === 'true';
        const position = layers.length;
        layers.push( /*#__PURE__*/React.createElement("tr", {
          key: draggingLayer,
          className: classNames('layer', 'dragging', {
            'layersel': draggingLayer === currentLayerName,
            'lock': isLocked
          }),
          onMouseUp: () => this.selectLayer(draggingLayer),
          onMouseOver: () => this.highlightLayer(draggingLayer),
          onMouseOut: () => this.highlightLayer(),
          draggable: true,
          onDragStart: e => {
            this.layerDragStart(draggingLayer, position);
          },
          onDragEnter: e => {
            this.layerDragEnter(position);
          },
          onDragEnd: e => {
            this.layerDragEnd();
          }
        }, /*#__PURE__*/React.createElement("td", {
          className: "layercolor",
          onClick: e => {
            this.openLayerColorPanel(e, draggingLayer);
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            backgroundColor: drawing.getLayerColor(draggingLayer)
          }
        })), /*#__PURE__*/React.createElement("td", {
          className: "layername",
          onDoubleClick: () => this.layerDoubleClick(draggingLayer)
        }, draggingLayer), /*#__PURE__*/React.createElement("td", {
          className: classNames('layervis', {
            'layerinvis': !drawing.getLayerVisibility(draggingLayer)
          }),
          onClick: () => {
            this.setLayerVisibility(draggingLayer);
          }
        }, /*#__PURE__*/React.createElement("i", {
          className: "fa fa-eye"
        })), /*#__PURE__*/React.createElement("td", {
          className: "layerlock",
          onClick: isLocked ? e => this.unLockLayer(e, draggingLayer) : () => {
            this.selectLayer(draggingLayer);
          }
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-lock.svg"
        }))));
      });

      _defineProperty(this, "renderLayerList", () => {
        const {
          draggingLayer,
          draggingDestIndex
        } = this.state;
        const layers = [];
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = drawing.getNumLayers();
        const currentLayerName = drawing.getCurrentLayerName();

        for (let i = layerCount - 1; i >= 0; i--) {
          const layerName = drawing.getLayerName(i);
          const layer = drawing.getLayerByName(layerName);

          if (!layer) {
            continue;
          }

          const isLocked = layer.getAttribute('data-lock') === 'true';

          if (layers.length === draggingDestIndex) {
            this.appendDraggingLayerToLayerList(layers);
          }

          if (layerName !== draggingLayer) {
            const position = layers.length;
            layers.push( /*#__PURE__*/React.createElement("tr", {
              key: layerName,
              className: classNames('layer', {
                'layersel': layerName === currentLayerName,
                'lock': isLocked
              }),
              onMouseUp: () => this.selectLayer(layerName),
              onMouseOver: () => this.highlightLayer(layerName),
              onMouseOut: () => this.highlightLayer(),
              draggable: true,
              onDragStart: e => {
                this.layerDragStart(layerName, position);
              },
              onDragEnter: e => {
                this.layerDragEnter(position);
              },
              onDragEnd: e => {
                this.layerDragEnd();
              }
            }, /*#__PURE__*/React.createElement("td", {
              className: "layercolor",
              onClick: e => {
                this.openLayerColorPanel(e, layerName);
              }
            }, /*#__PURE__*/React.createElement("div", {
              style: {
                backgroundColor: drawing.getLayerColor(layerName)
              }
            })), /*#__PURE__*/React.createElement("td", {
              className: "layername",
              onDoubleClick: () => this.layerDoubleClick(layerName)
            }, layerName), /*#__PURE__*/React.createElement("td", {
              className: classNames('layervis', {
                'layerinvis': !drawing.getLayerVisibility(layerName)
              }),
              onClick: () => {
                this.setLayerVisibility(layerName);
              }
            }, /*#__PURE__*/React.createElement("i", {
              className: "fa fa-eye"
            })), /*#__PURE__*/React.createElement("td", {
              className: "layerlock",
              onClick: isLocked ? e => this.unLockLayer(e, layerName) : () => {
                this.selectLayer(layerName);
              }
            }, /*#__PURE__*/React.createElement("img", {
              src: "img/icon-lock.svg"
            }))));
          }
        }

        if (layers.length === draggingDestIndex) {
          this.appendDraggingLayerToLayerList(layers);
        }

        return /*#__PURE__*/React.createElement("table", {
          id: "layerlist"
        }, /*#__PURE__*/React.createElement("tbody", null, layers));
      });

      _defineProperty(this, "renderSelLayerBlock", () => {
        const {
          elem
        } = this.props;
        const options = [];
        const drawing = svgCanvas.getCurrentDrawing();
        const layerCount = svgCanvas.getCurrentDrawing().getNumLayers();

        if (!elem || layerCount === 1) {
          return null;
        }

        const currentLayerName = drawing.getCurrentLayerName();

        for (let i = layerCount - 1; i >= 0; i--) {
          const layerName = drawing.getLayerName(i);
          options.push( /*#__PURE__*/React.createElement("option", {
            value: layerName,
            key: i
          }, layerName));
        }

        return /*#__PURE__*/React.createElement("div", {
          className: "selLayerBlock controls"
        }, /*#__PURE__*/React.createElement("span", {
          id: "selLayerLabel"
        }, LANG.move_elems_to), /*#__PURE__*/React.createElement("select", {
          value: currentLayerName,
          id: "selLayerNames",
          title: "Move selected elements to a different layer",
          onChange: e => this.moveToOtherLayer(e),
          disabled: options.length < 2
        }, options));
      });

      this.state = {};

      window.populateLayers = () => {
        this.setState(this.state);
      };
    }

    componentDidMount() {
      ret.contextCaller = this.context;
      this.renderLayerLaserConfigs();
    }

    componentDidUpdate() {
      this.renderLayerLaserConfigs();
    }

    componentWillUnmount() {
      window.populateLayers = () => {};

      ret.contextCaller = null;
    }

    renderAddLayerButton() {
      return /*#__PURE__*/React.createElement("div", {
        className: "add-layer-btn",
        onClick: () => {
          this.addNewLayer();
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "bar bar1"
      }), /*#__PURE__*/React.createElement("div", {
        className: "bar bar2"
      }), /*#__PURE__*/React.createElement("div", {
        className: "bar bar3"
      }));
    }

    render() {
      const {
        ContextMenu,
        MenuItem,
        ContextMenuTrigger
      } = require('react-contextmenu');

      if (!window.svgCanvas) {
        setTimeout(() => {
          this.setState(this.state);
        }, 50);
        return null;
      }

      return /*#__PURE__*/React.createElement("div", {
        id: "layer-and-laser-panel"
      }, /*#__PURE__*/React.createElement("div", {
        id: "layerpanel",
        onMouseOut: () => this.highlightLayer()
      }, /*#__PURE__*/React.createElement(ContextMenuTrigger, {
        id: "layer-contextmenu",
        holdToDisplay: -1
      }, /*#__PURE__*/React.createElement("div", {
        id: "layerlist_container"
      }, /*#__PURE__*/React.createElement("div", {
        id: "color_picker_placeholder"
      }), this.renderLayerList())), this.renderAddLayerButton(), this.renderSelLayerBlock(), /*#__PURE__*/React.createElement(ContextMenu, {
        id: "layer-contextmenu"
      }, /*#__PURE__*/React.createElement(MenuItem, {
        onClick: this.cloneLayer
      }, LANG.layers.dupe), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: this.lockLayer
      }, LANG.layers.lock), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: this.deleteLayer
      }, LANG.layers.del), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: this.mergeLayer
      }, LANG.layers.merge_down), /*#__PURE__*/React.createElement(MenuItem, {
        onClick: this.mergeAllLayer
      }, LANG.layers.merge_all))), /*#__PURE__*/React.createElement("div", {
        id: "layer-laser-panel-placeholder"
      }));
    }

  }

  LayerPanel.contextType = LayerPanelContext;
  ret.LayerPanel = LayerPanel;
  return ret;
});