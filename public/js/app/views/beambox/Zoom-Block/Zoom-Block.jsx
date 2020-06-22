define([
    'jsx!views/beambox/Zoom-Block/contexts/Zoom-Block-Context',
    'app/actions/beambox/constant',
    'app/constants/macOS-Window-Size',
    'helpers/i18n'
], function(
    { ZoomBlockContext },
    Constant,
    macOSWindowSize,
    i18n
) {
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
            this.state = {
                dpmm: null
            };
        }

        componentDidMount() {
            ret.contextCaller = this.context;
            this.getDpmm();
        }

        getDpmm = async () => {
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
                            this.setState({dpmm});
                            return;
                        }
                    }
                }
            }
            const dpiCalculator = $('#dpi-calculator');
            const dpmm = dpiCalculator.width() / (100 * devicePixelRatio);

            this.setState({dpmm});
        }

        componentWillUnmount() {
        }

        calculatCurrentRatio() {
            const { dpmm } = this.state;
            if (!window.svgCanvas || !dpmm) {
                return 1;
            }
            const ratio = svgCanvas.getZoom() * Constant.dpmm / dpmm;
            return ratio;
        }

        renderDpiCalculator() {
            const { dpmm } = this.state;
            if (!dpmm) {
                return (<div id="dpi-calculator"/>);
            }
            return null;
        }

        setRatio = (ratio) => {
            const { dpmm } = this.state;
            ratio /= 100;
            const targetZoom = ratio * dpmm / Constant.dpmm;
            svgEditor.zoomChanged(window, {zoomLevel: targetZoom})
        }

        zoomIn = (currentRatio) => {
            const ratioInPercent = Math.round(currentRatio * 100);
            const targetRatio = ratioInPercent + ((10 - ratioInPercent % 10) || 10);
            this.setRatio(targetRatio);
        }

        zoomOut = (currentRatio) => {
            const ratioInPercent = Math.round(currentRatio * 100);
            const targetRatio = ratioInPercent - (ratioInPercent % 10 || 10);
            this.setRatio(targetRatio);
        }

        render() {
            const ratio = this.calculatCurrentRatio();
            const ratioInPercent = Math.round(ratio * 100);
            const { ContextMenu, MenuItem, ContextMenuTrigger } = require('react-contextmenu');
            return (
                <div className="zoom-block">
                    {this.renderDpiCalculator()}
                    <ContextMenuTrigger id="zoom-block-contextmenu" holdToDisplay={-1}>
                        <div className="zoom-btn zoom-out" onClick={() => this.zoomOut(ratio)}>
                            <div className="bar bar1"/>
                        </div>
                        <ContextMenuTrigger id="zoom-block-contextmenu" holdToDisplay={0}>
                            <div className="zoom-ratio">
                                {`${ratioInPercent}%`}
                            </div>
                        </ContextMenuTrigger>
                        <div className="zoom-btn zoom-in" onClick={() => this.zoomIn(ratio)}>
                            <div className="bar bar1"/>
                            <div className="bar bar2"/>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenu id="zoom-block-contextmenu">
                        <MenuItem onClick={() => svgEditor.resetView()}>{LANG.fit_to_window}</MenuItem>
                        <MenuItem onClick={() => this.setRatio(25)}>{'25 %'}</MenuItem>
                        <MenuItem onClick={() => this.setRatio(50)}>{'50 %'}</MenuItem>
                        <MenuItem onClick={() => this.setRatio(75)}>{'75 %'}</MenuItem>
                        <MenuItem onClick={() => this.setRatio(100)}>{'100 %'}</MenuItem>
                        <MenuItem onClick={() => this.setRatio(150)}>{'150 %'}</MenuItem>
                        <MenuItem onClick={() => this.setRatio(200)}>{'200 %'}</MenuItem>
                    </ContextMenu>
                </div>
            );
        }
    } 
    ZoomBlock.contextType = ZoomBlockContext;
    ret.ZoomBlock = ZoomBlock;
    return ret;
});
