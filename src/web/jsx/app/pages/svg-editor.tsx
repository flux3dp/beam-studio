requirejs.config({
  waitSeconds: 30,
  paths: {
    svgEditor: 'app/actions/beambox/svg-editor',
    jsHotkeys: 'lib/svgeditor/js-hotkeys/jquery.hotkeys.min',
    jquerybbq: 'lib/svgeditor/jquerybbq/jquery.bbq.min',
    svgicons: 'lib/svgeditor/svgicons/jquery.svgicons',
    jgraduate: 'lib/svgeditor/jgraduate/jquery.jgraduate.min',
    spinbtn: 'lib/svgeditor/spinbtn/JQuerySpinBtn.min',
    touch: 'lib/svgeditor/touch',
    svgedit: 'lib/svgeditor/svgedit',
    jquerySvg: 'lib/svgeditor/jquery-svg',
    jqueryContextMenu: 'lib/svgeditor/contextmenu/jquery.contextMenu',
    pathseg: 'lib/svgeditor/pathseg',
    browser: 'lib/svgeditor/browser',
    svgtransformlist: 'lib/svgeditor/svgtransformlist',
    math: 'lib/svgeditor/math',
    units: 'lib/svgeditor/units',
    svgutils: 'lib/svgeditor/svgutils',
    sanitize: 'lib/svgeditor/sanitize',
    history: 'lib/svgeditor/history',
    historyrecording: 'lib/svgeditor/historyrecording',
    coords: 'lib/svgeditor/coords',
    recalculate: 'lib/svgeditor/recalculate',
    select: 'lib/svgeditor/select',
    draw: 'lib/svgeditor/draw',
    layer: 'lib/svgeditor/layer',
    path: 'lib/svgeditor/path',
    svgcanvas: 'lib/svgeditor/svgcanvas',
    beameasyapi: 'lib/svgeditor/beam-easy-api',
    locale: 'lib/svgeditor/locale/locale',
    contextmenu: 'lib/svgeditor/contextmenu',
    clipper_unminified: 'lib/clipper_unminified',
    svgnest: 'lib/svg-nest/svgnest',
    svgnestGeoUtil: 'lib/svg-nest/util/geometryutil',
    svgnestParallel: 'lib/svg-nest/util/parallel',
    svgnestEval: 'lib/svg-nest/util/eval',
    jqueryUi: 'lib/svgeditor/jquery-ui/jquery-ui-1.8.17.custom.min',
    jpicker: 'lib/svgeditor/jgraduate/jpicker'
  },
  shim: {
    //load in the same order with js/lib/svgeditor/svg-editor.html
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
    svgedit: {
      deps: ['touch']
    },
    jquerySvg: {
      deps: ['svgedit']
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
    svgEditor: {
      deps: ['beameasyapi']
    },
    locale: {
      deps: ['svgEditor']
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
  }
});
define(['helpers/i18n', 'jsx!views/beambox/Task-Interpreter-Panel', 'jsx!views/beambox/Right-Panels/Right-Panel', 'jsx!views/beambox/Right-Panels/contexts/RightPanelContext', 'jsHotkeys', 'jquerybbq', 'svgicons', 'jgraduate', 'spinbtn', 'touch', 'svgedit', 'jquerySvg', 'jqueryContextMenu', 'pathseg', 'browser', 'svgtransformlist', 'math', 'units', 'svgutils', 'sanitize', 'history', 'historyrecording', 'coords', 'recalculate', 'select', 'draw', 'layer', 'path', 'svgcanvas', 'svgEditor', 'locale', 'contextmenu', 'clipper_unminified', 'jqueryUi', 'jpicker', 'css!svgeditor/svg-editor', 'css!svgeditor/jgraduate/css/jPicker', 'css!svgeditor/jgraduate/css/jgraduate', 'css!svgeditor/spinbtn/JQuerySpinBtn', //'css!svgeditor/custom.css'
'lib/svgeditor/canvg/canvg', 'lib/svgeditor/canvg/rgbcolor'], function (i18n, TaskInterpreterPanel, RightPanel, RightPanelContext) {
  'use strict';

  const React = require('react');

  let LANG = i18n.lang.beambox;
  RightPanel = RightPanel.RightPanel;
  const RightPanelContextProvider = RightPanelContext.RightPanelContextProvider;

  class view extends React.Component {
    componentDidMount(node) {
      $(svgEditor.init);
      svgEditor.resetView();
    }

    _handleDisableHref(e) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    render() {
      // HIDE ALMOST ALL TOOLS USING CSS
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TaskInterpreterPanel, null), /*#__PURE__*/React.createElement("div", {
        id: "svg_editor"
      }, /*#__PURE__*/React.createElement("div", {
        id: "rulers"
      }, /*#__PURE__*/React.createElement("div", {
        id: "ruler_corner"
      }), /*#__PURE__*/React.createElement("div", {
        id: "ruler_x"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("canvas", {
        height: 15
      }))), /*#__PURE__*/React.createElement("div", {
        id: "ruler_y"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("canvas", {
        width: 15
      }))), /*#__PURE__*/React.createElement("div", {
        id: "ruler_unit_shower"
      }, "mm")), /*#__PURE__*/React.createElement("div", {
        id: "workarea"
      }, /*#__PURE__*/React.createElement("style", {
        id: "styleoverrides",
        type: "text/css",
        media: "screen",
        scoped: "scoped",
        dangerouslySetInnerHTML: {
          __html: ''
        }
      }), /*#__PURE__*/React.createElement("div", {
        id: "svgcanvas",
        style: {
          position: 'relative'
        }
      })), /*#__PURE__*/React.createElement(RightPanelContextProvider, null, /*#__PURE__*/React.createElement(RightPanel, null)), /*#__PURE__*/React.createElement("div", {
        id: "main_button"
      }, /*#__PURE__*/React.createElement("div", {
        id: "main_icon",
        className: "tool_button",
        title: "Main Menu"
      }, /*#__PURE__*/React.createElement("span", null, "SVG-Edit"), /*#__PURE__*/React.createElement("div", {
        id: "logo"
      }), /*#__PURE__*/React.createElement("div", {
        className: "dropdown"
      })), /*#__PURE__*/React.createElement("div", {
        id: "main_menu"
      }, /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", {
        id: "tool_clear"
      }, /*#__PURE__*/React.createElement("div", null), "New Image (N)"), /*#__PURE__*/React.createElement("li", {
        id: "tool_open",
        style: {
          display: 'none'
        }
      }, /*#__PURE__*/React.createElement("div", {
        id: "fileinputs"
      }, /*#__PURE__*/React.createElement("div", null)), "Open SVG"), /*#__PURE__*/React.createElement("li", {
        id: "tool_import",
        style: {
          display: 'none'
        }
      }, /*#__PURE__*/React.createElement("div", {
        id: "fileinputs_import"
      }, /*#__PURE__*/React.createElement("div", null)), "Import Image"), /*#__PURE__*/React.createElement("li", {
        id: "tool_save"
      }, /*#__PURE__*/React.createElement("div", null), "Save Image (S)"), /*#__PURE__*/React.createElement("li", {
        id: "tool_export"
      }, /*#__PURE__*/React.createElement("div", null), "Export"), /*#__PURE__*/React.createElement("li", {
        id: "tool_docprops"
      }, /*#__PURE__*/React.createElement("div", null), "Document Properties (D)")), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
        href: "https://github.com/SVG-Edit/svgedit",
        target: "_blank"
      }, "SVG-edit Home Page")), /*#__PURE__*/React.createElement("button", {
        id: "tool_prefs_option"
      }, "Editor Options"))), /*#__PURE__*/React.createElement("div", {
        id: "tools_top",
        className: "tools_panel"
      }, /*#__PURE__*/React.createElement("div", {
        id: "editor_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_source",
        title: "Edit Source [U]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_wireframe",
        title: "Wireframe Mode [F]"
      })), /*#__PURE__*/React.createElement("div", {
        id: "history_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button tool_button_disabled",
        id: "tool_undo",
        title: "Undo [Z]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button tool_button_disabled",
        id: "tool_redo",
        title: "Redo [Y]"
      })), /*#__PURE__*/React.createElement("div", {
        id: "selected_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_clone",
        title: "Duplicate Element [D]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_delete",
        title: "Delete Element [Delete/Backspace]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_move_top",
        title: "Bring to Front [ Ctrl+Shift+] ]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_move_bottom",
        title: "Send to Back [ Ctrl+Shift+[ ]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_topath",
        title: "Convert to Path"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_reorient",
        title: "Reorient path"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_make_link",
        title: "Make (hyper)link"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("label", {
        id: "idLabel",
        title: "Identify the element"
      }, /*#__PURE__*/React.createElement("span", null, "id:"), /*#__PURE__*/React.createElement("input", {
        id: "elem_id",
        className: "attr_changer",
        "data-attr": "id",
        size: 10,
        type: "text"
      })), /*#__PURE__*/React.createElement("label", {
        id: "classLabel",
        title: "Element class"
      }, /*#__PURE__*/React.createElement("span", null, "class:"), /*#__PURE__*/React.createElement("input", {
        id: "elem_class",
        className: "attr_changer",
        "data-attr": "class",
        size: 10,
        type: "text"
      }))), /*#__PURE__*/React.createElement("label", {
        id: "tool_angle",
        title: "Change rotation angle",
        className: "toolset"
      }, /*#__PURE__*/React.createElement("span", {
        id: "angleLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "angle",
        size: 2,
        defaultValue: 0,
        type: "text"
      })), /*#__PURE__*/React.createElement("div", {
        className: "toolset",
        id: "tool_blur",
        title: "Change gaussian blur value"
      }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "blurLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "blur",
        size: 2,
        defaultValue: 0,
        type: "text"
      })), /*#__PURE__*/React.createElement("div", {
        id: "blur_dropdown",
        className: "dropdown"
      }, /*#__PURE__*/React.createElement("button", null), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", {
        className: "special"
      }, /*#__PURE__*/React.createElement("div", {
        id: "blur_slider"
      }))))), /*#__PURE__*/React.createElement("div", {
        className: "dropdown toolset",
        id: "tool_position",
        title: "Align Element to Page"
      }, /*#__PURE__*/React.createElement("div", {
        id: "cur_position",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("button", null)), /*#__PURE__*/React.createElement("div", {
        id: "xy_panel",
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", null, "x:", ' ', /*#__PURE__*/React.createElement("input", {
        id: "selected_x",
        className: "attr_changer",
        title: "Change X coordinate",
        size: 3,
        "data-attr": "x"
      })), /*#__PURE__*/React.createElement("label", null, "y:", ' ', /*#__PURE__*/React.createElement("input", {
        id: "selected_y",
        className: "attr_changer",
        title: "Change Y coordinate",
        size: 3,
        "data-attr": "y"
      })))), /*#__PURE__*/React.createElement("div", {
        id: "multiselected_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_clone_multi",
        title: "Clone Elements [C]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_delete_multi",
        title: "Delete Selected Elements [Delete/Backspace]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_group_elements",
        title: "Group Elements [G]"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_make_link_multi",
        title: "Make (hyper)link"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_alignleft",
        title: "Align Left"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_aligncenter",
        title: "Align Center"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_alignright",
        title: "Align Right"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_aligntop",
        title: "Align Top"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_alignmiddle",
        title: "Align Middle"
      }), /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_alignbottom",
        title: "Align Bottom"
      }), /*#__PURE__*/React.createElement("label", {
        id: "tool_align_relative"
      }, /*#__PURE__*/React.createElement("span", {
        id: "relativeToLabel"
      }, "relative to:"), /*#__PURE__*/React.createElement("select", {
        id: "align_relative_to",
        title: "Align relative to ..."
      }, /*#__PURE__*/React.createElement("option", {
        id: "selected_objects",
        value: "selected"
      }, "selected objects"), /*#__PURE__*/React.createElement("option", {
        id: "largest_object",
        value: "largest"
      }, "largest object"), /*#__PURE__*/React.createElement("option", {
        id: "smallest_object",
        value: "smallest"
      }, "smallest object"), /*#__PURE__*/React.createElement("option", {
        id: "page",
        value: "page"
      }, "page"))), /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      })), /*#__PURE__*/React.createElement("div", {
        id: "rect_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "rect_width_tool",
        title: "Change rectangle width"
      }, /*#__PURE__*/React.createElement("span", {
        id: "rwidthLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "rect_width",
        className: "attr_changer",
        size: 3,
        "data-attr": "width"
      })), /*#__PURE__*/React.createElement("label", {
        id: "rect_height_tool",
        title: "Change rectangle height"
      }, /*#__PURE__*/React.createElement("span", {
        id: "rheightLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "rect_height",
        className: "attr_changer",
        size: 3,
        "data-attr": "height"
      }))), /*#__PURE__*/React.createElement("label", {
        id: "cornerRadiusLabel",
        title: "Change Rectangle Corner Radius",
        className: "toolset"
      }, /*#__PURE__*/React.createElement("span", {
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "rect_rx",
        size: 3,
        defaultValue: 0,
        type: "text",
        "data-attr": "Corner Radius"
      }))), /*#__PURE__*/React.createElement("div", {
        id: "image_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "iwidthLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "image_width",
        className: "attr_changer",
        title: "Change image width",
        size: 3,
        "data-attr": "width"
      })), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "iheightLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "image_height",
        className: "attr_changer",
        title: "Change image height",
        size: 3,
        "data-attr": "height"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_image_url"
      }, "url:", /*#__PURE__*/React.createElement("input", {
        id: "image_url",
        type: "text",
        title: "Change URL",
        size: 35
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_change_image"
      }, /*#__PURE__*/React.createElement("button", {
        id: "change_image_url",
        style: {
          display: 'none'
        }
      }, "Change Image"), /*#__PURE__*/React.createElement("span", {
        id: "url_notice",
        title: "NOTE: This image cannot be embedded. It will depend on this path to be displayed"
      })))), /*#__PURE__*/React.createElement("div", {
        id: "circle_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_circle_cx"
      }, "cx:", /*#__PURE__*/React.createElement("input", {
        id: "circle_cx",
        className: "attr_changer",
        title: "Change circle's cx coordinate",
        size: 3,
        "data-attr": "cx"
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_circle_cy"
      }, "cy:", /*#__PURE__*/React.createElement("input", {
        id: "circle_cy",
        className: "attr_changer",
        title: "Change circle's cy coordinate",
        size: 3,
        "data-attr": "cy"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_circle_r"
      }, "r:", /*#__PURE__*/React.createElement("input", {
        id: "circle_r",
        className: "attr_changer",
        title: "Change circle's radius",
        size: 3,
        "data-attr": "r"
      })))), /*#__PURE__*/React.createElement("div", {
        id: "ellipse_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_ellipse_cx"
      }, "cx:", /*#__PURE__*/React.createElement("input", {
        id: "ellipse_cx",
        className: "attr_changer",
        title: "Change ellipse's cx coordinate",
        size: 3,
        "data-attr": "cx"
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_ellipse_cy"
      }, "cy:", /*#__PURE__*/React.createElement("input", {
        id: "ellipse_cy",
        className: "attr_changer",
        title: "Change ellipse's cy coordinate",
        size: 3,
        "data-attr": "cy"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_ellipse_rx"
      }, "rx:", /*#__PURE__*/React.createElement("input", {
        id: "ellipse_rx",
        className: "attr_changer",
        title: "Change ellipse's x radius",
        size: 3,
        "data-attr": "rx"
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_ellipse_ry"
      }, "ry:", /*#__PURE__*/React.createElement("input", {
        id: "ellipse_ry",
        className: "attr_changer",
        title: "Change ellipse's y radius",
        size: 3,
        "data-attr": "ry"
      })))), /*#__PURE__*/React.createElement("div", {
        id: "line_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_line_x1"
      }, "x1:", /*#__PURE__*/React.createElement("input", {
        id: "line_x1",
        className: "attr_changer",
        title: "Change line's starting x coordinate",
        size: 3,
        "data-attr": "x1"
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_line_y1"
      }, "y1:", /*#__PURE__*/React.createElement("input", {
        id: "line_y1",
        className: "attr_changer",
        title: "Change line's starting y coordinate",
        size: 3,
        "data-attr": "y1"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_line_x2"
      }, "x2:", /*#__PURE__*/React.createElement("input", {
        id: "line_x2",
        className: "attr_changer",
        title: "Change line's ending x coordinate",
        size: 3,
        "data-attr": "x2"
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_line_y2"
      }, "y2:", /*#__PURE__*/React.createElement("input", {
        id: "line_y2",
        className: "attr_changer",
        title: "Change line's ending y coordinate",
        size: 3,
        "data-attr": "y2"
      })))), /*#__PURE__*/React.createElement("div", {
        id: "text_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "toolset"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_bold",
        title: "Bold Text [B]"
      }, /*#__PURE__*/React.createElement("span", null), "B"), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_italic",
        title: "Italic Text [I]"
      }, /*#__PURE__*/React.createElement("span", null), "i")), /*#__PURE__*/React.createElement("div", {
        className: "toolset",
        id: "tool_font_family"
      }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
        id: "font_family",
        type: "text",
        title: "Change Font Family",
        size: 12
      })), /*#__PURE__*/React.createElement("div", {
        id: "font_family_dropdown",
        className: "dropdown"
      }, /*#__PURE__*/React.createElement("button", null), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", {
        style: {
          fontFamily: 'serif'
        }
      }, "Serif"), /*#__PURE__*/React.createElement("li", {
        style: {
          fontFamily: 'sans-serif'
        }
      }, "Sans-serif"), /*#__PURE__*/React.createElement("li", {
        style: {
          fontFamily: 'cursive'
        }
      }, "Cursive"), /*#__PURE__*/React.createElement("li", {
        style: {
          fontFamily: 'fantasy'
        }
      }, "Fantasy"), /*#__PURE__*/React.createElement("li", {
        style: {
          fontFamily: 'monospace'
        }
      }, "Monospace")))), /*#__PURE__*/React.createElement("label", {
        id: "tool_font_size",
        title: "Change Font Size"
      }, /*#__PURE__*/React.createElement("span", {
        id: "font_sizeLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "font_size",
        size: 3,
        defaultValue: 0,
        type: "text"
      })), /*#__PURE__*/React.createElement("input", {
        id: "text",
        type: "text",
        size: 35
      })), /*#__PURE__*/React.createElement("div", {
        id: "container_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("label", {
        id: "group_title",
        title: "Group identification label"
      }, /*#__PURE__*/React.createElement("span", null, "label:"), /*#__PURE__*/React.createElement("input", {
        id: "g_title",
        "data-attr": "title",
        size: 10,
        type: "text"
      }))), /*#__PURE__*/React.createElement("div", {
        id: "use_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_unlink_use",
        title: "Break link to reference element (make unique)"
      })), /*#__PURE__*/React.createElement("div", {
        id: "g_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "push_button",
        id: "tool_ungroup",
        title: "Ungroup Elements [G]"
      })), /*#__PURE__*/React.createElement("div", {
        id: "a_panel"
      }, /*#__PURE__*/React.createElement("label", {
        id: "tool_link_url",
        title: "Set link URL (leave empty to remove)"
      }, /*#__PURE__*/React.createElement("span", {
        id: "linkLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "link_url",
        type: "text",
        size: 35
      }))), /*#__PURE__*/React.createElement("div", {
        id: "path_node_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button push_button_pressed",
        id: "tool_node_link",
        title: "Link Control Points"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      }), /*#__PURE__*/React.createElement("label", {
        id: "tool_node_x"
      }, "x:", /*#__PURE__*/React.createElement("input", {
        id: "path_node_x",
        className: "attr_changer",
        title: "Change node's x coordinate",
        size: 3,
        "data-attr": "x"
      })), /*#__PURE__*/React.createElement("label", {
        id: "tool_node_y"
      }, "y:", /*#__PURE__*/React.createElement("input", {
        id: "path_node_y",
        className: "attr_changer",
        title: "Change node's y coordinate",
        size: 3,
        "data-attr": "y"
      })), /*#__PURE__*/React.createElement("select", {
        id: "seg_type",
        title: "Change Segment type",
        defaultValue: 4
      }, /*#__PURE__*/React.createElement("option", {
        id: "straight_segments",
        value: 4
      }, "Straight"), /*#__PURE__*/React.createElement("option", {
        id: "curve_segments",
        value: 6
      }, "Curve")), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_node_clone",
        title: "Clone Node"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_node_delete",
        title: "Delete Node"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_openclose_path",
        title: "Open/close sub-path"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_add_subpath",
        title: "Add sub-path"
      }))), ' ', /*#__PURE__*/React.createElement("div", {
        id: "cur_context_panel"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tools_left",
        className: "tools_panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_select",
        title: "Select Tool"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_fhpath",
        title: "Pencil Tool"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_line",
        title: "Line Tool"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button flyout_current",
        id: "tools_rect_show",
        title: "Square/Rect Tool"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flyout_arrow_horiz"
      })), /*#__PURE__*/React.createElement("div", {
        className: "tool_button flyout_current",
        id: "tools_ellipse_show",
        title: "Ellipse/Circle Tool"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flyout_arrow_horiz"
      })), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_path",
        title: "Path Tool"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_text",
        title: "Text Tool"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_image",
        title: "Image Tool"
      }), /*#__PURE__*/React.createElement("div", {
        className: "tool_button",
        id: "tool_zoom",
        title: "Zoom Tool [Ctrl+Up/Down]"
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'none'
        }
      }, /*#__PURE__*/React.createElement("div", {
        id: "tool_rect",
        title: "Rectangle"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_square",
        title: "Square"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_fhrect",
        title: "Free-Hand Rectangle"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_ellipse",
        title: "Ellipse"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_path",
        title: "Path"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_polygon",
        title: "Polygon"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_grid",
        title: "Grid Array"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_circle",
        title: "Circle"
      }), /*#__PURE__*/React.createElement("div", {
        id: "tool_fhellipse",
        title: "Free-Hand Ellipse"
      }))), ' ', /*#__PURE__*/React.createElement("div", {
        id: "tools_bottom",
        className: "tools_panel"
      }, /*#__PURE__*/React.createElement("div", {
        id: "zoom_panel",
        className: "toolset",
        title: "Change zoom level"
      }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "zoomLabel",
        className: "zoom_tool icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "zoom",
        size: 3,
        defaultValue: 100,
        type: "text"
      })), /*#__PURE__*/React.createElement("div", {
        className: "tool_sep"
      })), /*#__PURE__*/React.createElement("div", {
        id: "tools_bottom_2"
      }, /*#__PURE__*/React.createElement("div", {
        id: "color_tools"
      }, /*#__PURE__*/React.createElement("div", {
        className: "color_tool",
        id: "tool_fill"
      }, /*#__PURE__*/React.createElement("label", {
        className: "icon_label",
        htmlFor: "fill_color",
        title: "Change fill color"
      }), /*#__PURE__*/React.createElement("div", {
        className: "color_block"
      }, /*#__PURE__*/React.createElement("div", {
        id: "fill_bg"
      }), /*#__PURE__*/React.createElement("div", {
        id: "fill_color",
        className: "color_block"
      }))), /*#__PURE__*/React.createElement("div", {
        className: "color_tool",
        id: "tool_stroke"
      }, /*#__PURE__*/React.createElement("label", {
        className: "icon_label",
        title: "Change stroke color"
      }), /*#__PURE__*/React.createElement("div", {
        className: "color_block"
      }, /*#__PURE__*/React.createElement("div", {
        id: "stroke_bg"
      }), /*#__PURE__*/React.createElement("div", {
        id: "stroke_color",
        className: "color_block",
        title: "Change stroke color"
      })), /*#__PURE__*/React.createElement("label", {
        className: "stroke_label"
      }, /*#__PURE__*/React.createElement("input", {
        id: "stroke_width",
        title: "Change stroke width by 1, shift-click to change by 0.1",
        size: 2,
        defaultValue: 5,
        type: "text",
        "data-attr": "Stroke Width"
      })), /*#__PURE__*/React.createElement("div", {
        id: "toggle_stroke_tools",
        title: "Show/hide more stroke tools"
      }), /*#__PURE__*/React.createElement("label", {
        className: "stroke_tool"
      }, /*#__PURE__*/React.createElement("select", {
        id: "stroke_style",
        defaultValue: "none",
        title: "Change stroke dash style"
      }, /*#__PURE__*/React.createElement("option", {
        value: "none"
      }, "\u2014"), /*#__PURE__*/React.createElement("option", {
        value: "2,2"
      }, "..."), /*#__PURE__*/React.createElement("option", {
        value: "5,5"
      }, "- -"), /*#__PURE__*/React.createElement("option", {
        value: "5,2,2,2"
      }, "- ."), /*#__PURE__*/React.createElement("option", {
        value: "5,2,2,2,2,2"
      }, "- .."))), /*#__PURE__*/React.createElement("div", {
        className: "stroke_tool dropdown",
        id: "stroke_linejoin"
      }, /*#__PURE__*/React.createElement("div", {
        id: "cur_linejoin",
        title: "Linejoin: Miter"
      }), /*#__PURE__*/React.createElement("button", null)), /*#__PURE__*/React.createElement("div", {
        className: "stroke_tool dropdown",
        id: "stroke_linecap"
      }, /*#__PURE__*/React.createElement("div", {
        id: "cur_linecap",
        title: "Linecap: Butt"
      }), /*#__PURE__*/React.createElement("button", null))), /*#__PURE__*/React.createElement("div", {
        className: "color_tool",
        id: "tool_opacity",
        title: "Change selected item opacity"
      }, /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "group_opacityLabel",
        className: "icon_label"
      }), /*#__PURE__*/React.createElement("input", {
        id: "group_opacity",
        size: 3,
        defaultValue: 100,
        type: "text"
      })), /*#__PURE__*/React.createElement("div", {
        id: "opacity_dropdown",
        className: "dropdown"
      }, /*#__PURE__*/React.createElement("button", null), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "0%"), /*#__PURE__*/React.createElement("li", null, "25%"), /*#__PURE__*/React.createElement("li", null, "50%"), /*#__PURE__*/React.createElement("li", null, "75%"), /*#__PURE__*/React.createElement("li", null, "100%"), /*#__PURE__*/React.createElement("li", {
        className: "special"
      }, /*#__PURE__*/React.createElement("div", {
        id: "opac_slider"
      }))))))), /*#__PURE__*/React.createElement("div", {
        id: "tools_bottom_3"
      }, /*#__PURE__*/React.createElement("div", {
        id: "palette_holder"
      }, /*#__PURE__*/React.createElement("div", {
        id: "palette",
        title: "Click to change fill color, shift-click to change stroke color"
      })))), /*#__PURE__*/React.createElement("div", {
        id: "option_lists",
        className: "dropdown"
      }, /*#__PURE__*/React.createElement("ul", {
        id: "linejoin_opts"
      }, /*#__PURE__*/React.createElement("li", {
        className: "tool_button current",
        id: "linejoin_miter",
        title: "Linejoin: Miter"
      }), /*#__PURE__*/React.createElement("li", {
        className: "tool_button",
        id: "linejoin_round",
        title: "Linejoin: Round"
      }), /*#__PURE__*/React.createElement("li", {
        className: "tool_button",
        id: "linejoin_bevel",
        title: "Linejoin: Bevel"
      })), /*#__PURE__*/React.createElement("ul", {
        id: "linecap_opts"
      }, /*#__PURE__*/React.createElement("li", {
        className: "tool_button current",
        id: "linecap_butt",
        title: "Linecap: Butt"
      }), /*#__PURE__*/React.createElement("li", {
        className: "tool_button",
        id: "linecap_square",
        title: "Linecap: Square"
      }), /*#__PURE__*/React.createElement("li", {
        className: "tool_button",
        id: "linecap_round",
        title: "Linecap: Round"
      })), /*#__PURE__*/React.createElement("ul", {
        id: "position_opts",
        className: "optcols3"
      }, /*#__PURE__*/React.createElement("li", {
        className: "push_button",
        id: "tool_posleft",
        title: "Align Left"
      }), /*#__PURE__*/React.createElement("li", {
        className: "push_button",
        id: "tool_poscenter",
        title: "Align Center"
      }), /*#__PURE__*/React.createElement("li", {
        className: "push_button",
        id: "tool_posright",
        title: "Align Right"
      }), /*#__PURE__*/React.createElement("li", {
        className: "push_button",
        id: "tool_postop",
        title: "Align Top"
      }), /*#__PURE__*/React.createElement("li", {
        className: "push_button",
        id: "tool_posmiddle",
        title: "Align Middle"
      }), /*#__PURE__*/React.createElement("li", {
        className: "push_button",
        id: "tool_posbottom",
        title: "Align Bottom"
      }))), /*#__PURE__*/React.createElement("div", {
        id: "color_picker"
      })), ' ', /*#__PURE__*/React.createElement("div", {
        id: "svg_source_editor"
      }, /*#__PURE__*/React.createElement("div", {
        className: "overlay"
      }), /*#__PURE__*/React.createElement("div", {
        id: "svg_source_container"
      }, /*#__PURE__*/React.createElement("div", {
        id: "tool_source_back",
        className: "toolbar_button"
      }, /*#__PURE__*/React.createElement("button", {
        id: "tool_source_save"
      }, "Apply Changes"), /*#__PURE__*/React.createElement("button", {
        id: "tool_source_cancel"
      }, "Cancel")), /*#__PURE__*/React.createElement("div", {
        id: "save_output_btns"
      }, /*#__PURE__*/React.createElement("p", {
        id: "copy_save_note"
      }, "Copy the contents of this box into a text editor, then save the file with a .svg extension."), /*#__PURE__*/React.createElement("button", {
        id: "copy_save_done"
      }, "Done")), /*#__PURE__*/React.createElement("form", null, /*#__PURE__*/React.createElement("textarea", {
        id: "svg_source_textarea",
        spellCheck: "false",
        defaultValue: ''
      })))), /*#__PURE__*/React.createElement("div", {
        id: "svg_docprops"
      }, /*#__PURE__*/React.createElement("div", {
        className: "overlay"
      }), /*#__PURE__*/React.createElement("div", {
        id: "svg_docprops_container"
      }, /*#__PURE__*/React.createElement("div", {
        id: "tool_docprops_back",
        className: "toolbar_button"
      }, /*#__PURE__*/React.createElement("button", {
        id: "tool_docprops_save"
      }, "OK"), /*#__PURE__*/React.createElement("button", {
        id: "tool_docprops_cancel"
      }, "Cancel")), /*#__PURE__*/React.createElement("fieldset", {
        id: "svg_docprops_docprops"
      }, /*#__PURE__*/React.createElement("legend", {
        id: "svginfo_image_props"
      }, "Image Properties"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_title"
      }, "Title:"), /*#__PURE__*/React.createElement("input", {
        type: "text",
        id: "canvas_title"
      })), /*#__PURE__*/React.createElement("fieldset", {
        id: "change_resolution"
      }, /*#__PURE__*/React.createElement("legend", {
        id: "svginfo_dim"
      }, "Canvas Dimensions"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_width"
      }, "width:"), ' ', /*#__PURE__*/React.createElement("input", {
        type: "text",
        id: "canvas_width",
        size: 6
      })), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_height"
      }, "height:"), ' ', /*#__PURE__*/React.createElement("input", {
        type: "text",
        id: "canvas_height",
        size: 6
      })), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("select", {
        id: "resolution",
        defaultValue: "predefined"
      }, /*#__PURE__*/React.createElement("option", {
        id: "selectedPredefined",
        value: "predefined"
      }, "Select predefined:"), /*#__PURE__*/React.createElement("option", null, "640x480"), /*#__PURE__*/React.createElement("option", null, "800x600"), /*#__PURE__*/React.createElement("option", null, "1024x768"), /*#__PURE__*/React.createElement("option", null, "1280x960"), /*#__PURE__*/React.createElement("option", null, "1600x1200"), /*#__PURE__*/React.createElement("option", {
        id: "fitToContent",
        value: "content"
      }, "Fit to Content")))), /*#__PURE__*/React.createElement("fieldset", {
        id: "image_save_opts"
      }, /*#__PURE__*/React.createElement("legend", {
        id: "includedImages"
      }, "Included Images"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
        type: "radio",
        name: "image_opt",
        defaultValue: "embed",
        defaultChecked: "checked"
      }), ' ', /*#__PURE__*/React.createElement("span", {
        id: "image_opt_embed"
      }, "Embed data (local files)"), ' '), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
        type: "radio",
        name: "image_opt",
        defaultValue: "ref"
      }), ' ', /*#__PURE__*/React.createElement("span", {
        id: "image_opt_ref"
      }, "Use file reference"), ' '))))), /*#__PURE__*/React.createElement("div", {
        id: "svg_prefs"
      }, /*#__PURE__*/React.createElement("div", {
        className: "overlay"
      }), /*#__PURE__*/React.createElement("div", {
        id: "svg_prefs_container"
      }, /*#__PURE__*/React.createElement("div", {
        id: "tool_prefs_back",
        className: "toolbar_button"
      }, /*#__PURE__*/React.createElement("button", {
        id: "tool_prefs_save"
      }, "OK"), /*#__PURE__*/React.createElement("button", {
        id: "tool_prefs_cancel"
      }, "Cancel")), /*#__PURE__*/React.createElement("fieldset", null, /*#__PURE__*/React.createElement("legend", {
        id: "svginfo_editor_prefs"
      }, "Editor Preferences"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_lang"
      }, "Language:"), /*#__PURE__*/React.createElement("select", {
        id: "lang_select",
        defaultValue: "en"
      }, /*#__PURE__*/React.createElement("option", {
        id: "lang_en",
        value: "en"
      }, "English"), /*#__PURE__*/React.createElement("option", {
        id: "lang_zh-TW",
        value: "zh-TW"
      }, "\u7E41\u9AD4\u4E2D\u6587"), /*#__PURE__*/React.createElement("option", {
        id: "lang_ja",
        value: "ja"
      }, "\u65E5\u672C\u8A9E"), /*#__PURE__*/React.createElement("option", {
        id: "lang_zh-CN",
        value: "zh-CN"
      }, "\u7C21\u4E2D"))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_icons"
      }, "Icon size:"), /*#__PURE__*/React.createElement("select", {
        id: "iconsize",
        defaultValue: "m"
      }, /*#__PURE__*/React.createElement("option", {
        id: "icon_small",
        value: "s"
      }, "Small"), /*#__PURE__*/React.createElement("option", {
        id: "icon_medium",
        value: "m"
      }, "Medium"), /*#__PURE__*/React.createElement("option", {
        id: "icon_large",
        value: "l"
      }, "Large"), /*#__PURE__*/React.createElement("option", {
        id: "icon_xlarge",
        value: "xl"
      }, "Extra Large"))), /*#__PURE__*/React.createElement("fieldset", {
        id: "change_background"
      }, /*#__PURE__*/React.createElement("legend", {
        id: "svginfo_change_background"
      }, "Editor Background"), /*#__PURE__*/React.createElement("div", {
        id: "bg_blocks"
      }), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_bg_url"
      }, "URL:"), ' ', /*#__PURE__*/React.createElement("input", {
        type: "text",
        id: "canvas_bg_url"
      })), /*#__PURE__*/React.createElement("p", {
        id: "svginfo_bg_note"
      }, "Note: Background will not be saved with image.")), /*#__PURE__*/React.createElement("fieldset", {
        id: "change_grid"
      }, /*#__PURE__*/React.createElement("legend", {
        id: "svginfo_grid_settings"
      }, "Grid"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_snap_onoff"
      }, "Snapping on/off"), /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        defaultValue: "snapping_on",
        id: "grid_snapping_on"
      })), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_snap_step"
      }, "Snapping Step-Size:"), ' ', /*#__PURE__*/React.createElement("input", {
        type: "text",
        id: "grid_snapping_step",
        size: 3,
        defaultValue: 10
      })), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_grid_color"
      }, "Grid color:"), ' ', /*#__PURE__*/React.createElement("input", {
        type: "text",
        id: "grid_color",
        size: 3,
        defaultValue: "#000"
      }))), /*#__PURE__*/React.createElement("fieldset", {
        id: "units_rulers"
      }, /*#__PURE__*/React.createElement("legend", {
        id: "svginfo_units_rulers"
      }, "Units & Rulers"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_rulers_onoff"
      }, "Show rulers"), /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        defaultValue: "show_rulers",
        id: "show_rulers",
        defaultChecked: "checked"
      })), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("span", {
        id: "svginfo_unit"
      }, "Base Unit:"), /*#__PURE__*/React.createElement("select", {
        id: "base_unit"
      }, /*#__PURE__*/React.createElement("option", {
        value: "px"
      }, "Pixels"), /*#__PURE__*/React.createElement("option", {
        value: "cm"
      }, "Centimeters"), /*#__PURE__*/React.createElement("option", {
        value: "mm"
      }, "Millimeters"), /*#__PURE__*/React.createElement("option", {
        value: "in"
      }, "Inches"), /*#__PURE__*/React.createElement("option", {
        value: "pt"
      }, "Points"), /*#__PURE__*/React.createElement("option", {
        value: "pc"
      }, "Picas"), /*#__PURE__*/React.createElement("option", {
        value: "em"
      }, "Ems"), /*#__PURE__*/React.createElement("option", {
        value: "ex"
      }, "Exs"))))))), /*#__PURE__*/React.createElement("div", {
        id: "dialog_box"
      }, /*#__PURE__*/React.createElement("div", {
        className: "overlay"
      }), /*#__PURE__*/React.createElement("div", {
        id: "dialog_container"
      }, /*#__PURE__*/React.createElement("div", {
        id: "dialog_content"
      }), /*#__PURE__*/React.createElement("div", {
        id: "dialog_buttons"
      }))), /*#__PURE__*/React.createElement("ul", {
        id: "cmenu_canvas",
        className: "contextMenu"
      }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#cut",
        onClick: this._handleDisableHref
      }, "Cut")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#copy",
        onClick: this._handleDisableHref
      }, "Copy")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#paste",
        onClick: this._handleDisableHref
      }, "Paste")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#paste_in_place",
        onClick: this._handleDisableHref
      }, "Paste in Place")), /*#__PURE__*/React.createElement("li", {
        className: "separator"
      }, /*#__PURE__*/React.createElement("a", {
        href: "#delete",
        onClick: this._handleDisableHref
      }, "Delete")), /*#__PURE__*/React.createElement("li", {
        className: "separator"
      }, /*#__PURE__*/React.createElement("a", {
        href: "#group",
        onClick: this._handleDisableHref
      }, "Group")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#ungroup",
        onClick: this._handleDisableHref
      }, "Ungroup")), /*#__PURE__*/React.createElement("li", {
        className: "separator"
      }, /*#__PURE__*/React.createElement("a", {
        href: "#move_front",
        onClick: this._handleDisableHref
      }, "Bring to Front")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#move_up",
        onClick: this._handleDisableHref
      }, "Bring Forward")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#move_down",
        onClick: this._handleDisableHref
      }, "Send Backward")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
        href: "#move_back",
        onClick: this._handleDisableHref
      }, "Send to Back"))));
    }

  }

  return view;
});