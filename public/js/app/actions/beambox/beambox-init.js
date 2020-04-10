define([
    'helpers/api/config',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/constant',
    'jsx!app/actions/beambox/Object-Panels-Controller',
    'jsx!app/actions/beambox/Tool-Panels-Controller',
    'jsx!app/actions/beambox/Laser-Panel-Controller',
    'jsx!app/actions/beambox/Image-Trace-Panel-Controller',
], function (
    ConfigHelper,
    BeamboxPreference,
    Constant,
    ObjectPanelsController,
    ToolPanelsController,
    LaserPanelController,
    ImageTracePanelController
) {
    const init = () => {
        ObjectPanelsController.init('object-panels-placeholder');
        ToolPanelsController.init('tool-panels-placeholder');
        LaserPanelController.init('layer-laser-panel-placeholder');
        ImageTracePanelController.init('image-trace-panel-placeholder');

        const defaultAutoFocus = BeamboxPreference.read('default-autofocus');
        if (defaultAutoFocus !== undefined) {
            BeamboxPreference.write('enable-autofocus', defaultAutoFocus);
        }
        const defaultDiode = BeamboxPreference.read('default-diode');
        if (defaultDiode !== undefined) {
            BeamboxPreference.write('enable-diode', defaultDiode);
        }
        const defaultBorderless = BeamboxPreference.read('default-borderless');
        if (defaultBorderless === undefined) {
            BeamboxPreference.write('default-borderless', BeamboxPreference.read('borderless'));
        } else {
            BeamboxPreference.write('borderless', defaultBorderless);
        }
    };

    const displayGuides = () => {
        const guidesLines = (() => {
            const svgdoc = document.getElementById('svgcanvas').ownerDocument;
            const NS = svgedit.NS;
            const linesGroup = svgdoc.createElementNS(NS.SVG, 'svg');
            const lineVertical = svgdoc.createElementNS(NS.SVG, 'line');
            const lineHorizontal = svgdoc.createElementNS(NS.SVG, 'line');

            svgedit.utilities.assignAttributes(linesGroup, {
                'id': 'guidesLines',
                'width': '100%',
                'height': '100%',
                'x': 0,
                'y': 0,
                'viewBox': `0 0 ${Constant.dimension.getWidth()} ${Constant.dimension.getHeight()}`,
                'style': 'pointer-events: none'
            });

            svgedit.utilities.assignAttributes(lineHorizontal, {
                'id': 'horizontal_guide',
                'x1': 0,
                'x2': Constant.dimension.getWidth(),
                'y1': BeamboxPreference.read('guide_y0') * 10,
                'y2': BeamboxPreference.read('guide_y0') * 10,
                'stroke': '#000',
                'stroke-width': '2',
                'stroke-opacity': 0.8,
                'stroke-dasharray': '5, 5',
                'vector-effect': 'non-scaling-stroke',
                fill: 'none',
                style: 'pointer-events:none'
            });

            svgedit.utilities.assignAttributes(lineVertical, {
                'id': 'vertical_guide',
                'x1': BeamboxPreference.read('guide_x0') * 10,
                'x2': BeamboxPreference.read('guide_x0') * 10,
                'y1': 0,
                'y2': Constant.dimension.getHeight(),
                'stroke': '#000',
                'stroke-width': '2',
                'stroke-opacity': 0.8,
                'stroke-dasharray': '5, 5',
                'vector-effect': 'non-scaling-stroke',
                fill: 'none',
                style: 'pointer-events:none'
            });

            linesGroup.appendChild(lineHorizontal);
            linesGroup.appendChild(lineVertical);
            return linesGroup;
        })();

        $('#canvasBackground').get(0).appendChild(guidesLines);
    };

    return {
        init: init,
        displayGuides: displayGuides
    };
});
