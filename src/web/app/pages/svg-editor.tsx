import storage from 'helpers/storage-helper';
import * as i18n from 'helpers/i18n';
import TaskInterpreterPanel from 'app/views/beambox/Task-Interpreter-Panel';
import { RightPanel } from 'app/views/beambox/Right-Panels/Right-Panel';
import { RightPanelContextProvider } from 'app/views/beambox/Right-Panels/contexts/RightPanelContext';
import svgEditor from 'app/actions/beambox/svg-editor';
import $ from 'jquery';

// TODO: fix loading these libraries?
const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox;
export default class SVGEditor extends React.Component {
  componentDidMount() {
    $(svgEditor.init);
  }

  // eslint-disable-next-line class-methods-use-this
  handleDisableHref(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  render() {
    // HIDE ALMOST ALL TOOLS USING CSS
    return (
      <div>
        <TaskInterpreterPanel />
        <div id="svg_editor" className={classNames({ mac: process.platform === 'darwin' })}>
          <div id="rulers" className={classNames({ mac: process.platform === 'darwin' })}>
            <div id="ruler_corner" />
            <div id="ruler_x">
              <div>
                <canvas height={15} />
              </div>
            </div>
            <div id="ruler_y">
              <div>
                <canvas width={15} />
              </div>
            </div>
            <div id="ruler_unit_shower">{storage.get('default-units') === 'inches' ? 'inch' : 'mm'}</div>
          </div>
          <div id="workarea" className={classNames({ mac: process.platform === 'darwin' })}>
            <style
              id="styleoverrides"
              type="text/css"
              media="screen"
              scoped="scoped"
              dangerouslySetInnerHTML={{
                __html: '',
              }}
            />
            <div
              id="svgcanvas"
              style={{
                position: 'relative',
              }}
            />
          </div>
          <RightPanelContextProvider>
            <RightPanel />
          </RightPanelContextProvider>
          <div id="main_button">
            <div id="main_icon" className="tool_button" title="Main Menu">
              <span>SVG-Edit</span>
              <div id="logo" />
              <div className="dropdown" />
            </div>
            <div id="main_menu">
              { }
              <ul>
                <li id="tool_clear">
                  <div />
                  New Image (N)
                </li>
                <li
                  id="tool_open"
                  style={{
                    display: 'none',
                  }}
                >
                  <div id="fileinputs">
                    <div />
                  </div>
                  Open SVG
                </li>
                <li
                  id="tool_import"
                  style={{
                    display: 'none',
                  }}
                >
                  <div id="fileinputs_import">
                    <div />
                  </div>
                  Import Image
                </li>
                <li id="tool_save">
                  <div />
                  Save Image (S)
                </li>
                <li id="tool_export">
                  <div />
                  Export
                </li>
                <li id="tool_docprops">
                  <div />
                  Document Properties (D)
                </li>
              </ul>
              <p>
                <a href="https://github.com/SVG-Edit/svgedit" target="_blank" rel="noreferrer">
                  SVG-edit Home Page
                </a>
              </p>
              <button id="tool_prefs_option" type="button">Editor Options</button>
            </div>
          </div>
          <div id="tools_top" className="tools_panel">
            <div id="editor_panel">
              <div className="tool_sep" />
              <div
                className="push_button"
                id="tool_source"
                title="Edit Source [U]"
              />
              <div
                className="tool_button"
                id="tool_wireframe"
                title="Wireframe Mode [F]"
              />
            </div>
            { }
            <div id="history_panel">
              <div className="tool_sep" />
              <div
                className="push_button tool_button_disabled"
                id="tool_undo"
                title="Undo [Z]"
              />
              <div
                className="push_button tool_button_disabled"
                id="tool_redo"
                title="Redo [Y]"
              />
            </div>
            { }
            <div id="selected_panel">
              <div className="toolset">
                <div className="tool_sep" />
                <div
                  className="push_button"
                  id="tool_clone"
                  title="Duplicate Element [D]"
                />
                <div
                  className="push_button"
                  id="tool_delete"
                  title="Delete Element [Delete/Backspace]"
                />
                <div className="tool_sep" />
                <div
                  className="push_button"
                  id="tool_move_top"
                  title="Bring to Front [ Ctrl+Shift+] ]"
                />
                <div
                  className="push_button"
                  id="tool_move_bottom"
                  title="Send to Back [ Ctrl+Shift+[ ]"
                />
                <div
                  className="push_button"
                  id="tool_topath"
                  title="Convert to Path"
                />
                <div
                  className="push_button"
                  id="tool_reorient"
                  title="Reorient path"
                />
                <div
                  className="push_button"
                  id="tool_make_link"
                  title="Make (hyper)link"
                />
                <div className="tool_sep" />
                <label id="idLabel" title="Identify the element">
                  <span>id:</span>
                  <input
                    id="elem_id"
                    className="attr_changer"
                    data-attr="id"
                    size={10}
                    type="text"
                  />
                </label>
                <label id="classLabel" title="Element class">
                  <span>class:</span>
                  <input
                    id="elem_class"
                    className="attr_changer"
                    data-attr="class"
                    size={10}
                    type="text"
                  />
                </label>
              </div>
              <label
                id="tool_angle"
                title="Change rotation angle"
                className="toolset"
              >
                <span id="angleLabel" className="icon_label" />
                <input id="angle" size={2} defaultValue={0} type="text" />
              </label>
              <div
                className="toolset"
                id="tool_blur"
                title="Change gaussian blur value"
              >
                <label>
                  <span id="blurLabel" className="icon_label" />
                  <input id="blur" size={2} defaultValue={0} type="text" />
                </label>
                <div id="blur_dropdown" className="dropdown">
                  <button type="button" />
                  <ul>
                    <li className="special">
                      <div id="blur_slider" />
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className="dropdown toolset"
                id="tool_position"
                title="Align Element to Page"
              >
                <div id="cur_position" className="icon_label" />
                <button type="button" />
              </div>
              <div id="xy_panel" className="toolset">
                <label>
                  x:
                  {' '}
                  <input
                    id="selected_x"
                    className="attr_changer"
                    title="Change X coordinate"
                    size={3}
                    data-attr="x"
                  />
                </label>
                <label>
                  y:
                  {' '}
                  <input
                    id="selected_y"
                    className="attr_changer"
                    title="Change Y coordinate"
                    size={3}
                    data-attr="y"
                  />
                </label>
              </div>
            </div>
            { }
            <div id="multiselected_panel">
              <div className="tool_sep" />
              <div
                className="push_button"
                id="tool_clone_multi"
                title="Clone Elements [C]"
              />
              <div
                className="push_button"
                id="tool_delete_multi"
                title="Delete Selected Elements [Delete/Backspace]"
              />
              <div className="tool_sep" />
              <div
                className="push_button"
                id="tool_group_elements"
                title="Group Elements [G]"
              />
              <div
                className="push_button"
                id="tool_make_link_multi"
                title="Make (hyper)link"
              />
              <div
                className="push_button"
                id="tool_alignleft"
                title="Align Left"
              />
              <div
                className="push_button"
                id="tool_aligncenter"
                title="Align Center"
              />
              <div
                className="push_button"
                id="tool_alignright"
                title="Align Right"
              />
              <div
                className="push_button"
                id="tool_aligntop"
                title="Align Top"
              />
              <div
                className="push_button"
                id="tool_alignmiddle"
                title="Align Middle"
              />
              <div
                className="push_button"
                id="tool_alignbottom"
                title="Align Bottom"
              />
              <label id="tool_align_relative">
                <span id="relativeToLabel">relative to:</span>
                <select id="align_relative_to" title="Align relative to ...">
                  <option id="selected_objects" value="selected">
                    selected objects
                  </option>
                  <option id="largest_object" value="largest">
                    largest object
                  </option>
                  <option id="smallest_object" value="smallest">
                    smallest object
                  </option>
                  <option id="page" value="page">
                    page
                  </option>
                </select>
              </label>
              <div className="tool_sep" />
            </div>
            <div id="rect_panel">
              <div className="toolset">
                <label id="rect_width_tool" title="Change rectangle width">
                  <span id="rwidthLabel" className="icon_label" />
                  <input
                    id="rect_width"
                    className="attr_changer"
                    size={3}
                    data-attr="width"
                  />
                </label>
                <label id="rect_height_tool" title="Change rectangle height">
                  <span id="rheightLabel" className="icon_label" />
                  <input
                    id="rect_height"
                    className="attr_changer"
                    size={3}
                    data-attr="height"
                  />
                </label>
              </div>
              <label
                id="cornerRadiusLabel"
                title="Change Rectangle Corner Radius"
                className="toolset"
              >
                <span className="icon_label" />
                <input
                  id="rect_rx"
                  size={3}
                  defaultValue={0}
                  type="text"
                  data-attr="Corner Radius"
                />
              </label>
            </div>
            <div id="image_panel">
              <div className="toolset">
                <label>
                  <span id="iwidthLabel" className="icon_label" />
                  <input
                    id="image_width"
                    className="attr_changer"
                    title="Change image width"
                    size={3}
                    data-attr="width"
                  />
                </label>
                <label>
                  <span id="iheightLabel" className="icon_label" />
                  <input
                    id="image_height"
                    className="attr_changer"
                    title="Change image height"
                    size={3}
                    data-attr="height"
                  />
                </label>
              </div>
              <div className="toolset">
                <label id="tool_image_url">
                  url:
                  <input
                    id="image_url"
                    type="text"
                    title="Change URL"
                    size={35}
                  />
                </label>
                <label id="tool_change_image">
                  <button
                    id="change_image_url"
                    style={{
                      display: 'none',
                    }}
                    type="button"
                  >
                    Change Image
                  </button>
                  <span
                    id="url_notice"
                    title="NOTE: This image cannot be embedded. It will depend on this path to be displayed"
                  />
                </label>
              </div>
            </div>
            <div id="circle_panel">
              <div className="toolset">
                <label id="tool_circle_cx">
                  cx:
                  <input
                    id="circle_cx"
                    className="attr_changer"
                    title="Change circle's cx coordinate"
                    size={3}
                    data-attr="cx"
                  />
                </label>
                <label id="tool_circle_cy">
                  cy:
                  <input
                    id="circle_cy"
                    className="attr_changer"
                    title="Change circle's cy coordinate"
                    size={3}
                    data-attr="cy"
                  />
                </label>
              </div>
              <div className="toolset">
                <label id="tool_circle_r">
                  r:
                  <input
                    id="circle_r"
                    className="attr_changer"
                    title="Change circle's radius"
                    size={3}
                    data-attr="r"
                  />
                </label>
              </div>
            </div>
            <div id="ellipse_panel">
              <div className="toolset">
                <label id="tool_ellipse_cx">
                  cx:
                  <input
                    id="ellipse_cx"
                    className="attr_changer"
                    title="Change ellipse's cx coordinate"
                    size={3}
                    data-attr="cx"
                  />
                </label>
                <label id="tool_ellipse_cy">
                  cy:
                  <input
                    id="ellipse_cy"
                    className="attr_changer"
                    title="Change ellipse's cy coordinate"
                    size={3}
                    data-attr="cy"
                  />
                </label>
              </div>
              <div className="toolset">
                <label id="tool_ellipse_rx">
                  rx:
                  <input
                    id="ellipse_rx"
                    className="attr_changer"
                    title="Change ellipse's x radius"
                    size={3}
                    data-attr="rx"
                  />
                </label>
                <label id="tool_ellipse_ry">
                  ry:
                  <input
                    id="ellipse_ry"
                    className="attr_changer"
                    title="Change ellipse's y radius"
                    size={3}
                    data-attr="ry"
                  />
                </label>
              </div>
            </div>
            <div id="line_panel">
              <div className="toolset">
                <label id="tool_line_x1">
                  x1:
                  <input
                    id="line_x1"
                    className="attr_changer"
                    title="Change line's starting x coordinate"
                    size={3}
                    data-attr="x1"
                  />
                </label>
                <label id="tool_line_y1">
                  y1:
                  <input
                    id="line_y1"
                    className="attr_changer"
                    title="Change line's starting y coordinate"
                    size={3}
                    data-attr="y1"
                  />
                </label>
              </div>
              <div className="toolset">
                <label id="tool_line_x2">
                  x2:
                  <input
                    id="line_x2"
                    className="attr_changer"
                    title="Change line's ending x coordinate"
                    size={3}
                    data-attr="x2"
                  />
                </label>
                <label id="tool_line_y2">
                  y2:
                  <input
                    id="line_y2"
                    className="attr_changer"
                    title="Change line's ending y coordinate"
                    size={3}
                    data-attr="y2"
                  />
                </label>
              </div>
            </div>
            <div id="text_panel">
              <div className="toolset">
                <div
                  className="tool_button"
                  id="tool_bold"
                  title="Bold Text [B]"
                >
                  <span />
                  B
                </div>
                <div
                  className="tool_button"
                  id="tool_italic"
                  title="Italic Text [I]"
                >
                  <span />
                  i
                </div>
              </div>
              <div className="toolset" id="tool_font_family">
                <label>
                  { }
                  <input
                    id="font_family"
                    type="text"
                    title="Change Font Family"
                    size={12}
                  />
                </label>
                <div id="font_family_dropdown" className="dropdown">
                  <button type="button" />
                  <ul>
                    <li
                      style={{
                        fontFamily: 'serif',
                      }}
                    >
                      Serif
                    </li>
                    <li
                      style={{
                        fontFamily: 'sans-serif',
                      }}
                    >
                      Sans-serif
                    </li>
                    <li
                      style={{
                        fontFamily: 'cursive',
                      }}
                    >
                      Cursive
                    </li>
                    <li
                      style={{
                        fontFamily: 'fantasy',
                      }}
                    >
                      Fantasy
                    </li>
                    <li
                      style={{
                        fontFamily: 'monospace',
                      }}
                    >
                      Monospace
                    </li>
                  </ul>
                </div>
              </div>
              <label id="tool_font_size" title="Change Font Size">
                <span id="font_sizeLabel" className="icon_label" />
                <input id="font_size" size={3} defaultValue={0} type="text" />
              </label>
              { }
              <input id="text" type="text" size={35} />
            </div>
            { }
            <div id="container_panel">
              <div className="tool_sep" />
              { }
              <label id="group_title" title="Group identification label">
                <span>label:</span>
                <input id="g_title" data-attr="title" size={10} type="text" />
              </label>
            </div>
            <div id="use_panel">
              <div
                className="push_button"
                id="tool_unlink_use"
                title="Break link to reference element (make unique)"
              />
            </div>
            <div id="g_panel">
              <div
                className="push_button"
                id="tool_ungroup"
                title="Ungroup Elements [G]"
              />
            </div>
            { }
            <div id="a_panel">
              <label
                id="tool_link_url"
                title="Set link URL (leave empty to remove)"
              >
                <span id="linkLabel" className="icon_label" />
                <input id="link_url" type="text" size={35} />
              </label>
            </div>
            <div id="path_node_panel">
              <div className="tool_sep" />
              <div
                className="tool_button push_button_pressed"
                id="tool_node_link"
                title="Link Control Points"
              />
              <div className="tool_sep" />
              <label id="tool_node_x">
                x:
                <input
                  id="path_node_x"
                  className="attr_changer"
                  title="Change node's x coordinate"
                  size={3}
                  data-attr="x"
                />
              </label>
              <label id="tool_node_y">
                y:
                <input
                  id="path_node_y"
                  className="attr_changer"
                  title="Change node's y coordinate"
                  size={3}
                  data-attr="y"
                />
              </label>
              <select id="seg_type" title="Change Segment type" defaultValue={4}>
                <option id="straight_segments" value={4}>
                  Straight
                </option>
                <option id="curve_segments" value={6}>
                  Curve
                </option>
              </select>
              <div
                className="tool_button"
                id="tool_node_clone"
                title="Clone Node"
              />
              <div
                className="tool_button"
                id="tool_node_delete"
                title="Delete Node"
              />
              <div
                className="tool_button"
                id="tool_openclose_path"
                title="Open/close sub-path"
              />
              <div
                className="tool_button"
                id="tool_add_subpath"
                title="Add sub-path"
              />
            </div>
          </div>
          {' '}
          { }
          <div id="cur_context_panel" />
          <div id="tools_left" className="tools_panel">
            <div className="tool_button" id="tool_select" title="Select Tool" />
            <div className="tool_button" id="tool_fhpath" title="Pencil Tool" />
            <div className="tool_button" id="tool_line" title="Line Tool" />
            <div
              className="tool_button flyout_current"
              id="tools_rect_show"
              title="Square/Rect Tool"
            >
              <div className="flyout_arrow_horiz" />
            </div>
            <div
              className="tool_button flyout_current"
              id="tools_ellipse_show"
              title="Ellipse/Circle Tool"
            >
              <div className="flyout_arrow_horiz" />
            </div>
            <div className="tool_button" id="tool_path" title="Path Tool" />
            <div className="tool_button" id="tool_text" title="Text Tool" />
            <div className="tool_button" id="tool_image" title="Image Tool" />
            <div
              className="tool_button"
              id="tool_zoom"
              title="Zoom Tool [Ctrl+Up/Down]"
            />
            <div
              style={{
                display: 'none',
              }}
            >
              <div id="tool_rect" title="Rectangle" />
              <div id="tool_square" title="Square" />
              <div id="tool_fhrect" title="Free-Hand Rectangle" />
              <div id="tool_ellipse" title="Ellipse" />
              <div id="tool_path" title="Path" />
              <div id="tool_polygon" title="Polygon" />
              <div id="tool_grid" title="Grid Array" />
              <div id="tool_circle" title="Circle" />
              <div id="tool_fhellipse" title="Free-Hand Ellipse" />
            </div>
          </div>
          {' '}
          { }
          <div id="tools_bottom" className="tools_panel">
            { }
            <div id="zoom_panel" className="toolset" title="Change zoom level">
              <label>
                <span id="zoomLabel" className="zoom_tool icon_label" />
                <input id="zoom" size={3} defaultValue={100} type="text" />
              </label>
              {/* <div id="zoom_dropdown" className="dropdown">
                        <button />
                        <ul>
                        <li>1000%</li>
                        <li>400%</li>
                        <li>200%</li>
                        <li>100%</li>
                        <li>50%</li>
                        <li>25%</li>
                        <li id="fit_to_canvas" data-val="canvas">
                            Fit to canvas
                        </li>
                        <li id="fit_to_sel" data-val="selection">
                            Fit to selection
                        </li>
                        <li id="fit_to_layer_content" data-val="layer">
                            Fit to layer content
                        </li>
                        <li id="fit_to_all" data-val="content">
                            Fit to all content
                        </li>
                        <li>100%</li>
                        </ul>
                    </div> */}
              <div className="tool_sep" />
            </div>
            <div id="tools_bottom_2">
              <div id="color_tools">
                <div className="color_tool" id="tool_fill">
                  <label
                    className="icon_label"
                    htmlFor="fill_color"
                    title="Change fill color"
                  />
                  <div className="color_block">
                    <div id="fill_bg" />
                    <div id="fill_color" className="color_block" />
                  </div>
                </div>
                <div className="color_tool" id="tool_stroke">
                  <label className="icon_label" title="Change stroke color" />
                  <div className="color_block">
                    <div id="stroke_bg" />
                    <div
                      id="stroke_color"
                      className="color_block"
                      title="Change stroke color"
                    />
                  </div>
                  <label className="stroke_label">
                    <input
                      id="stroke_width"
                      title="Change stroke width by 1, shift-click to change by 0.1"
                      size={2}
                      defaultValue={5}
                      type="text"
                      data-attr="Stroke Width"
                    />
                  </label>
                  <div
                    id="toggle_stroke_tools"
                    title="Show/hide more stroke tools"
                  />
                  <label className="stroke_tool">
                    <select id="stroke_style" defaultValue="none" title="Change stroke dash style">
                      <option value="none">—</option>
                      <option value="2,2">...</option>
                      <option value="5,5">- -</option>
                      <option value="5,2,2,2">- .</option>
                      <option value="5,2,2,2,2,2">- ..</option>
                    </select>
                  </label>
                  <div className="stroke_tool dropdown" id="stroke_linejoin">
                    <div id="cur_linejoin" title="Linejoin: Miter" />
                    <button type="button" />
                  </div>
                  <div className="stroke_tool dropdown" id="stroke_linecap">
                    <div id="cur_linecap" title="Linecap: Butt" />
                    <button type="button" />
                  </div>
                </div>
                <div
                  className="color_tool"
                  id="tool_opacity"
                  title="Change selected item opacity"
                >
                  <label>
                    <span id="group_opacityLabel" className="icon_label" />
                    <input
                      id="group_opacity"
                      size={3}
                      defaultValue={100}
                      type="text"
                    />
                  </label>
                  <div id="opacity_dropdown" className="dropdown">
                    <button type="button" />
                    <ul>
                      <li>0%</li>
                      <li>25%</li>
                      <li>50%</li>
                      <li>75%</li>
                      <li>100%</li>
                      <li className="special">
                        <div id="opac_slider" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div id="tools_bottom_3">
              <div id="palette_holder">
                <div
                  id="palette"
                  title="Click to change fill color, shift-click to change stroke color"
                />
              </div>
            </div>
            { }
          </div>
          <div id="option_lists" className="dropdown">
            <ul id="linejoin_opts">
              <li
                className="tool_button current"
                id="linejoin_miter"
                title="Linejoin: Miter"
              />
              <li
                className="tool_button"
                id="linejoin_round"
                title="Linejoin: Round"
              />
              <li
                className="tool_button"
                id="linejoin_bevel"
                title="Linejoin: Bevel"
              />
            </ul>
            <ul id="linecap_opts">
              <li
                className="tool_button current"
                id="linecap_butt"
                title="Linecap: Butt"
              />
              <li
                className="tool_button"
                id="linecap_square"
                title="Linecap: Square"
              />
              <li
                className="tool_button"
                id="linecap_round"
                title="Linecap: Round"
              />
            </ul>
            <ul id="position_opts" className="optcols3">
              <li
                className="push_button"
                id="tool_posleft"
                title="Align Left"
              />
              <li
                className="push_button"
                id="tool_poscenter"
                title="Align Center"
              />
              <li
                className="push_button"
                id="tool_posright"
                title="Align Right"
              />
              <li className="push_button" id="tool_postop" title="Align Top" />
              <li
                className="push_button"
                id="tool_posmiddle"
                title="Align Middle"
              />
              <li
                className="push_button"
                id="tool_posbottom"
                title="Align Bottom"
              />
            </ul>
          </div>
          { }
          <div id="color_picker" />
        </div>
        {' '}
        {}
        <div id="svg_source_editor">
          <div className="overlay" />
          <div id="svg_source_container">
            <div id="tool_source_back" className="toolbar_button">
              <button id="tool_source_save" type="button">Apply Changes</button>
              <button id="tool_source_cancel" type="button">Cancel</button>
            </div>
            <div id="save_output_btns">
              <p id="copy_save_note">
                Copy the contents of this box into a text editor, then save the
                file with a .svg extension.
              </p>
              <button id="copy_save_done" type="button">Done</button>
            </div>
            <form>
              <textarea
                id="svg_source_textarea"
                spellCheck="false"
                defaultValue=""
              />
            </form>
          </div>
        </div>
        <div id="svg_docprops">
          <div className="overlay" />
          <div id="svg_docprops_container">
            <div id="tool_docprops_back" className="toolbar_button">
              <button id="tool_docprops_save" type="button">OK</button>
              <button id="tool_docprops_cancel" type="button">Cancel</button>
            </div>
            <fieldset id="svg_docprops_docprops">
              <legend id="svginfo_image_props">Image Properties</legend>
              <label>
                <span id="svginfo_title">Title:</span>
                <input type="text" id="canvas_title" />
              </label>
              <fieldset id="change_resolution">
                <legend id="svginfo_dim">Canvas Dimensions</legend>
                <label>
                  <span id="svginfo_width">width:</span>
                  {' '}
                  <input type="text" id="canvas_width" size={6} />
                </label>
                <label>
                  <span id="svginfo_height">height:</span>
                  {' '}
                  <input type="text" id="canvas_height" size={6} />
                </label>
                <label>
                  <select id="resolution" defaultValue="predefined">
                    <option id="selectedPredefined" value="predefined">
                      Select predefined:
                    </option>
                    <option>640x480</option>
                    <option>800x600</option>
                    <option>1024x768</option>
                    <option>1280x960</option>
                    <option>1600x1200</option>
                    <option id="fitToContent" value="content">
                      Fit to Content
                    </option>
                  </select>
                </label>
              </fieldset>
              <fieldset id="image_save_opts">
                <legend id="includedImages">Included Images</legend>
                <label>
                  <input
                    type="radio"
                    name="image_opt"
                    defaultValue="embed"
                    defaultChecked="checked"
                  />
                  {' '}
                  <span id="image_opt_embed">
                    Embed data (local files)
                  </span>
                  {' '}
                </label>
                <label>
                  <input
                    type="radio"
                    name="image_opt"
                    defaultValue="ref"
                  />
                  {' '}
                  <span id="image_opt_ref">Use file reference</span>
                  {' '}
                </label>
              </fieldset>
            </fieldset>
          </div>
        </div>
        <div id="svg_prefs">
          <div className="overlay" />
          <div id="svg_prefs_container">
            <div id="tool_prefs_back" className="toolbar_button">
              <button id="tool_prefs_save" type="button">OK</button>
              <button id="tool_prefs_cancel" type="button">Cancel</button>
            </div>
            <fieldset>
              <legend id="svginfo_editor_prefs">Editor Preferences</legend>
              <label>
                <span id="svginfo_lang">Language:</span>
                { }
                <select id="lang_select" defaultValue="en">
                  <option id="lang_de" value="de">
                    Deutsche
                  </option>
                  <option id="lang_en" value="en">
                    English
                  </option>
                  <option id="lang_zh-TW" value="zh-TW">
                    繁體中文
                  </option>
                  <option id="lang_ja" value="ja">
                    日本語
                  </option>
                  <option id="lang_zh-CN" value="es">
                    Español
                  </option>
                  <option id="lang_zh-CN" value="zh-CN">
                    簡中
                  </option>
                </select>
              </label>
              <label>
                <span id="svginfo_icons">Icon size:</span>
                <select id="iconsize" defaultValue="m">
                  <option id="icon_small" value="s">
                    Small
                  </option>
                  <option id="icon_medium" value="m">
                    Medium
                  </option>
                  <option id="icon_large" value="l">
                    Large
                  </option>
                  <option id="icon_xlarge" value="xl">
                    Extra Large
                  </option>
                </select>
              </label>
              <fieldset id="change_background">
                <legend id="svginfo_change_background">
                  Editor Background
                </legend>
                <div id="bg_blocks" />
                <label>
                  <span id="svginfo_bg_url">URL:</span>
                  {' '}
                  <input type="text" id="canvas_bg_url" />
                </label>
                <p id="svginfo_bg_note">
                  Note: Background will not be saved with image.
                </p>
              </fieldset>
              <fieldset id="change_grid">
                <legend id="svginfo_grid_settings">Grid</legend>
                <label>
                  <span id="svginfo_snap_onoff">Snapping on/off</span>
                  <input
                    type="checkbox"
                    defaultValue="snapping_on"
                    id="grid_snapping_on"
                  />
                </label>
                <label>
                  <span id="svginfo_snap_step">Snapping Step-Size:</span>
                  {' '}
                  <input
                    type="text"
                    id="grid_snapping_step"
                    size={3}
                    defaultValue={10}
                  />
                </label>
                <label>
                  <span id="svginfo_grid_color">Grid color:</span>
                  {' '}
                  <input
                    type="text"
                    id="grid_color"
                    size={3}
                    defaultValue="#000"
                  />
                </label>
              </fieldset>
              <fieldset id="units_rulers">
                <legend id="svginfo_units_rulers">Units & Rulers</legend>
                <label>
                  <span id="svginfo_rulers_onoff">Show rulers</span>
                  <input
                    type="checkbox"
                    defaultValue="show_rulers"
                    id="show_rulers"
                    defaultChecked="checked"
                  />
                </label>
                <label>
                  <span id="svginfo_unit">Base Unit:</span>
                  <select id="base_unit">
                    <option value="px">Pixels</option>
                    <option value="cm">Centimeters</option>
                    <option value="mm">Millimeters</option>
                    <option value="in">Inches</option>
                    <option value="pt">Points</option>
                    <option value="pc">Picas</option>
                    <option value="em">Ems</option>
                    <option value="ex">Exs</option>
                  </select>
                </label>
                { }
                { }
              </fieldset>
            </fieldset>
          </div>
        </div>
        <div id="dialog_box">
          <div className="overlay" />
          <div id="dialog_container">
            <div id="dialog_content" />
            <div id="dialog_buttons" />
          </div>
        </div>
        <ul id="cmenu_canvas" className="contextMenu">
          <li>
            <a href="#cut" onClick={this.handleDisableHref}>{LANG.context_menu.cut}</a>
          </li>
          <li>
            <a href="#copy" onClick={this.handleDisableHref}>{LANG.context_menu.copy}</a>
          </li>
          <li>
            <a href="#paste" onClick={this.handleDisableHref}>{LANG.context_menu.paste}</a>
          </li>
          <li>
            <a href="#paste_in_place" onClick={this.handleDisableHref}>{LANG.context_menu.paste_in_place}</a>
          </li>
          <li className="separator">
            <a href="#delete" onClick={this.handleDisableHref}>{LANG.context_menu.delete}</a>
          </li>
          <li className="separator">
            <a href="#group" onClick={this.handleDisableHref}>{LANG.context_menu.group}</a>
          </li>
          <li>
            <a href="#ungroup" onClick={this.handleDisableHref}>{LANG.context_menu.ungroup}</a>
          </li>
          <li className="separator">
            <a href="#move_front" onClick={this.handleDisableHref}>{LANG.context_menu.move_front}</a>
          </li>
          <li>
            <a href="#move_up" onClick={this.handleDisableHref}>{LANG.context_menu.move_up}</a>
          </li>
          <li>
            <a href="#move_down" onClick={this.handleDisableHref}>{LANG.context_menu.move_down}</a>
          </li>
          <li>
            <a href="#move_back" onClick={this.handleDisableHref}>{LANG.context_menu.move_back}</a>
          </li>
        </ul>
      </div>
    );
  }
}
