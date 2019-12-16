define([
    'jquery',
    'react',
    'app/actions/beambox/svgeditor-function-wrapper',
    'helpers/i18n',
], function($, React, FnWrapper, i18n) {

    const LANG = i18n.lang.beambox.object_panels;

    class FillPanel extends React.Component{

        constructor(props) {
            super(props);
            this.isClosed = true;
            const isFill = ((props.$me.attr('fill-opacity') === 1) && (props.$me.attr('fill') !== 'none'));
            this.state = {
                isFill: isFill
            };
            this._handleClick = this._handleClick.bind(this);
            if (props.type === 'path') {
                let segList = props.$me[0].pathSegList._list;
                let [startX, startY, currentX, currentY, isDrawing] = [0, 0, 0, 0, false];
                for (let i = 0; i < segList.length; i++) {
                    let seg = segList[i];
                    switch (seg.pathSegType) {
                        case 1:
                            [currentX, currentY] = [startX, startY];
                            isDrawing = false;
                            break;
                        case 2:
                        case 3:
                            if (isDrawing) {
                                if (seg.x !== currentX || seg.y !== currentY) {
                                    this.isClosed = false;
                                } else {
                                    [startX, startY, currentX, currentY] = [seg.x, seg.y, seg.x, seg.y];
                                }
                            } else {
                                [startX, startY, currentX, currentY] = [seg.x, seg.y, seg.x, seg.y];
                            }
                            break;
                        default:
                            isDrawing = true;
                            [currentX, currentY] = [seg.x, seg.y];
                            break;
                    }
                    if (!this.isClosed) {
                        break;
                    }
                }
                if (isDrawing && (startX !== currentX || startY !== currentY)) {
                    this.isClosed = false;
                }
            }
        }

        _handleClick() {
            if (this.state.isFill) {
                svgCanvas.setSelectedUnfill();
            } else {
                svgCanvas.setSelectedFill();
            }
            this.setState({isFill: !this.state.isFill});
        }

        render() {
            return this.isClosed ? (
                <div className='object-panel'>
                    <label className='controls accordion' onClick={this._handleClick}>
                        <p className='caption'>
                            {LANG.fill}
                            <label className='shading-checkbox' onClick={this._handleClick}>
                                <i className={this.state.isFill ? 'fa fa-toggle-on' : 'fa fa-toggle-off'} />
                            </label>
                        </p>
                    </label>
                </div>
            ) : null;
        }
    };

    return FillPanel;
});
