import BeamboxPreference from '../actions/beambox/beambox-preference';
import Constant from '../actions/beambox/constant';
import * as i18n from '../../helpers/i18n';
import { ITutorial } from '../../interfaces/ITutorial';

export enum TutorialCallbacks {
    SELECT_DEFAULT_RECT = 'SELECT_DEFAULT_RECT',
}

const React = requireNode('react');
const electron = requireNode('electron');
const systemPreferences = electron.remote.systemPreferences;

const LANG = i18n.lang.tutorial;

const nextStepRequirements = {
    SELECT_CIRCLE: 'SELECT_CIRCLE',
    SELECT_RECT: 'SELECT_RECT',
    DRAW_A_CIRCLE: 'DRAW_A_CIRCLE',
    DRAW_A_RECT: 'DRAW_A_RECT',
    INFILL: 'INFILL',
    SET_PRESET_WOOD_ENGRAVING: 'SET_PRESET_WOOD_ENGRAVING',
    SET_PRESET_WOOD_CUTTING: 'SET_PRESET_WOOD_CUTTING',
    ADD_NEW_LAYER: 'ADD_NEW_LAYER',
    TO_EDIT_MODE: 'TO_EDIT_MODE',
    TO_LAYER_PANEL: 'TO_LAYER_PANEL',
    TO_PREVIEW_MODE: 'TO_PREVIEW_MODE',
    PREVIEW_PLATFORM: 'PREVIEW_PLATFORM',
    SEND_FILE: 'SEND_FILE',
};

const isMac = process.platform === 'darwin';

const adjustFocusLinkClick = () => {
    // TODO: Add adjust focus link for Beambox2
    const model = BeamboxPreference.read('model') || 'fbb1b';
    if (['fbm1'].includes(model)) {
        electron.remote.shell.openExternal(LANG.links.adjust_focus_bm);
    } else {
        electron.remote.shell.openExternal(LANG.links.adjust_focus_bb);
    }
};

const NEW_USER_TUTORIAL: ITutorial = {
    id: 'NEW_USER_TUTORIAL',
    end_alert: LANG.newUser.end_alert,
    dialogStylesAndContents: [
        {
            dialogBoxStyles: {
                position: { left: isMac ? 100 : 25, top: 50 },
                arrowDirection: 'top',
                arrowPadding: isMac ? undefined : 9
            },
            holePosition: { left: isMac ? 80 : 3, top: 0 },
            holeSize: { width: 40, height: 40 },
            hintCircle: { left: isMac ? 82 : 7, top: 3, width: 36, height: 36 },
            text: LANG.newUser.switch_to_preview_mode,
            nextStepRequirement: nextStepRequirements.TO_PREVIEW_MODE
        },
        {
            dialogBoxStyles: {
                position: {
                    top: 300,
                    get left() {
                        return window.innerWidth - Constant.rightPanelWidth
                    },
                },
            },
            holePosition: { left: 50, right: 240, top: 0 },
            holeSize: {},
            hintCircle: {
                left: 55, top: 45,
                get width() {
                    return window.innerWidth - Constant.sidePanelsWidth - 10;
                },
                get height() {
                    return window.innerHeight - Constant.topBarHeight - 10;
                },
            },
            text: LANG.newUser.preview_the_platform,
            subElement: (
                <div className='sub-content'>
                    <div className='sub-line'>{LANG.newUser.put_wood}</div>
                    <div className='sub-line'>
                        {LANG.newUser.adjust_focus}
                        <div className='hint-mark' onClick={() => adjustFocusLinkClick()}>{'?'}</div>
                    </div>
                    <div className='sub-line'>{LANG.newUser.close_cover}</div>
                </div>
            ),
            nextStepRequirement: nextStepRequirements.PREVIEW_PLATFORM,
        },
        {
            dialogBoxStyles: {
                position: { left: 56, top: 68 }
            },
            holePosition: { left: 7, top: 58 },
            holeSize: { width: 36, height: 36 },
            hintCircle: { left: 5, top: 51, width: 40, height: 40 },
            text: LANG.newUser.end_preview_mode,
            nextStepRequirement: nextStepRequirements.TO_EDIT_MODE,
        },
        {
            dialogBoxStyles: {
                position: { left: 56, top: 240 }
            },
            holePosition: { left: 7, top: 230 },
            holeSize: { width: 36, height: 36 },
            hintCircle: { left: 5, top: 223, width: 40, height: 40 },
            text: LANG.newUser.draw_a_circle,
            nextStepRequirement: nextStepRequirements.SELECT_CIRCLE,
        },
        {
            dialogBoxStyles: {
                position: {
                    top: 300,
                    get left() {
                        return window.innerWidth - Constant.rightPanelWidth
                    },
                },
            },
            holePosition: { left: 50, right: 240, top: 40 },
            holeSize: {},
            hintCircle: {
                left: 55, top: 45,
                get width() {
                    return window.innerWidth - Constant.sidePanelsWidth - 10;
                },
                get height() {
                    return window.innerHeight - Constant.topBarHeight - 10;
                },
            },
            text: LANG.newUser.drag_to_draw,
            nextStepRequirement: nextStepRequirements.DRAW_A_CIRCLE,
        },
        {
            dialogBoxStyles: {
                position: { right: 65, top: 302 },
                arrowDirection: 'right'
            },
            holePosition: { right: 15, top: 290 },
            holeSize: { width: 55, height: 20 },
            hintCircle: { right: 9, top: 282, width: 55, height: 40 },
            text: LANG.newUser.infill,
            nextStepRequirement: nextStepRequirements.INFILL
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth + 3, top: Constant.topBarHeightWithoutTitleBar + 20 },
                arrowDirection: 'right'
            },
            holePosition: { right: Constant.rightPanelWidth - 32, top: Constant.topBarHeightWithoutTitleBar },
            holeSize: { width: 32, height: 40 },
            hintCircle: { right: Constant.rightPanelWidth - 37, top: Constant.topBarHeightWithoutTitleBar, width: 40, height: 40 },
            text: LANG.newUser.switch_to_layer_panel,
            nextStepRequirement: nextStepRequirements.TO_LAYER_PANEL,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth - 2, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 140 },
                arrowDirection: 'right'
            },
            holePosition: { right: 15, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 125 },
            holeSize: { width: Constant.rightPanelWidth - 22, height: 30 },
            hintCircle: { right: 5, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 121, width: Constant.rightPanelWidth - 12, height: 40 },
            text: LANG.newUser.set_preset_wood_engraving,
            nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_ENGRAVING
        },
        {
            dialogBoxStyles: {
                position: { right: 55, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 22 },
                arrowDirection: 'right'
            },
            holePosition: { right: 15, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 3 },
            holeSize: { width: 35, height: 35 },
            hintCircle: { right: 14, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 2, width: 40, height: 40 },
            text: LANG.newUser.add_new_layer,
            nextStepRequirement: nextStepRequirements.ADD_NEW_LAYER
        },
        {
            dialogBoxStyles: {
                position: { left: 56, top: 198 }
            },
            holePosition: { left: 7, top: 188 },
            holeSize: { width: 36, height: 36 },
            hintCircle: { left: 5, top: 179, width: 40, height: 40 },
            text: LANG.newUser.draw_a_rect,
            nextStepRequirement: nextStepRequirements.SELECT_RECT,
        },
        {
            dialogBoxStyles: {
                position: {
                    top: 300,
                    get left() {
                        return window.innerWidth - Constant.rightPanelWidth
                    },
                },
            },
            holePosition: { left: 50, right: 240, top: 40 },
            holeSize: {},
            hintCircle: {
                left: 55, top: 45,
                get width() {
                    return window.innerWidth - Constant.sidePanelsWidth - 10;
                },
                get height() {
                    return window.innerHeight - Constant.topBarHeight - 10;
                },
            },
            text: LANG.newUser.drag_to_draw,
            nextStepRequirement: nextStepRequirements.DRAW_A_RECT,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth + 3, top: Constant.topBarHeightWithoutTitleBar + 20 },
                arrowDirection: 'right'
            },
            holePosition: { right: Constant.rightPanelWidth - 32, top: Constant.topBarHeightWithoutTitleBar },
            holeSize: { width: 32, height: 40 },
            hintCircle: { right: Constant.rightPanelWidth - 37, top: Constant.topBarHeightWithoutTitleBar, width: 40, height: 40 },
            text: LANG.newUser.switch_to_layer_panel,
            nextStepRequirement: nextStepRequirements.TO_LAYER_PANEL,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth - 2, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 140 },
                arrowDirection: 'right'
            },
            holePosition: { right: 15, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 125 },
            holeSize: { width: Constant.rightPanelWidth - 22, height: 30 },
            hintCircle: { right: 5, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 121, width: Constant.rightPanelWidth - 12, height: 40 },
            text: LANG.newUser.set_preset_wood_cut,
            nextStepRequirement: nextStepRequirements.SET_PRESET_WOOD_CUTTING
        },
        {
            dialogBoxStyles: {
                position: { right: 20, top: 40 },
                arrowDirection: 'top',
                arrowPadding: 7
            },
            holePosition: { left: 0, top: 0 },
            holeSize: {},
            hintCircle: { right: 3, top: 3, width: isMac ? 36 : 64, height: isMac ? 36 : 33 },
            text: LANG.newUser.send_the_file,
            nextStepRequirement: nextStepRequirements.SEND_FILE
        },
    ],
};

const INTERFACE_TUTORIAL: ITutorial = {
    id: 'INTERFACE_TUTORIAL',
    hasNextButton: true,
    end_alert: LANG.newInterface.end_alert,
    dialogStylesAndContents: [
        {
            dialogBoxStyles: {
                position: { left: isMac ? 100 : 25, top: 50 },
                arrowDirection: 'top',
                arrowPadding: isMac ? undefined : 9
            },
            hintCircle: { left: isMac ? 82 : 7, top: 3, width: 36, height: 36 },
            text: LANG.newInterface.camera_preview,
        },
        {
            dialogBoxStyles: {
                position: { left: 56, top: Constant.topBarHeightWithoutTitleBar + 40 }
            },
            hintCircle: { left: 5, top: Constant.topBarHeightWithoutTitleBar + 5, width: 40, height: 135 },
            text: LANG.newInterface.select_image_text,
        },
        {
            dialogBoxStyles: {
                position: { left: 56, top: Constant.topBarHeightWithoutTitleBar + 175 }
            },
            hintCircle: { left: 5, top: Constant.topBarHeightWithoutTitleBar + 135, width: 40, height: 180 },
            text: LANG.newInterface.basic_shapes,
        },
        {
            dialogBoxStyles: {
                position: { left: 56, top: Constant.topBarHeightWithoutTitleBar + 330 }
            },
            hintCircle: { left: 5, top: Constant.topBarHeightWithoutTitleBar + 310, width: 40, height: 40 },
            text: LANG.newInterface.pen_tool,
        },
        {
            dialogBoxStyles: {
                position: { right: 55, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 22 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 14, top: Constant.topBarHeightWithoutTitleBar + Constant.layerListHeight + 2, width: 40, height: 40 },
            text: LANG.newInterface.add_new_layer,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth - 30, top: 100 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 60 + Constant.rightPanelScrollBarWidth, top: 82, width: 145, height: 36 },
            text: LANG.newInterface.rename_by_double_click,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 100 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 10, top: 82, width: Constant.rightPanelWidth - 15, height: 36 },
            text: LANG.newInterface.drag_to_sort,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 100 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 10, top: 82, width: Constant.rightPanelWidth - 15, height: 236 },
            text: LANG.newInterface.layer_controls,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 60 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 5, top: 42, width: Constant.rightPanelWidth - 10, height: 36 },
            text: LANG.newInterface.switch_between_layer_panel_and_object_panel,
            callback: TutorialCallbacks.SELECT_DEFAULT_RECT,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 100 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 10, top: 82, width: Constant.rightPanelWidth - 15, height: 36 },
            text: LANG.newInterface.align_controls,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 140 },
                arrowDirection: 'right'
            },
            hintCircle: { right: Constant.rightPanelWidth - 70, top: 123, width: 65, height: 36 },
            text: LANG.newInterface.group_controls,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 140 },
                arrowDirection: 'right'
            },
            hintCircle: { right: Constant.rightPanelScrollBarWidth + 5, top: 123, width: 115, height: 36 },
            text: LANG.newInterface.shape_operation,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelScrollBarWidth + 85, top: 230 },
                arrowDirection: 'right'
            },
            hintCircle: { right: Constant.rightPanelScrollBarWidth + 10, top: 213, width: 67, height: 34 },
            text: LANG.newInterface.flip,
        },
        {
            dialogBoxStyles: {
                position: { right: Constant.rightPanelWidth, top: 273 },
                arrowDirection: 'right'
            },
            hintCircle: { right: 5, top: 256, width: Constant.rightPanelWidth - 10, height: 180 },
            text: LANG.newInterface.object_actions,
        },
    ],
};

export default {
    ...nextStepRequirements,
    NEW_USER_TUTORIAL,
    INTERFACE_TUTORIAL,
};
