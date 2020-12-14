import svgEditor from 'app/actions/beambox/svg-editor';
import { DialogContext } from 'app/contexts/Dialog-Context';
import ToolPanelsController from 'app/actions/beambox/Tool-Panels-Controller';
import { Tutorial } from 'app/views/tutorials/Tutorial';
import { RightPanel } from 'app/views/beambox/Right-Panels/Right-Panel';
import OptionsPanel from 'app/views/beambox/Right-Panels/Options-Panel';
import { LayerPanel } from 'app/views/beambox/Right-Panels/Layer-Panel';
import { TimeEstimationButton } from 'app/views/beambox/Time-Estimation-Button/Time-Estimation-Button';
import grayScale from 'helpers/grayscale';

console.log("TSLoader", {
    svgEditor, 
    DialogContext,
    ToolPanelsController,
    Tutorial,
    RightPanel,
    OptionsPanel,
    LayerPanel,
    TimeEstimationButton,
    grayScale,
});
