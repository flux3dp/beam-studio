import shortcuts from '../../helpers/shortcuts';
import { getSVGAsync } from '../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
const React = requireNode('react');

export default class CurveControl extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            controlPoints: [{x: 0, y: 0}, {x: 255, y: 255}],
            selectingIndex: null
        };
        this.onBackgroundMouseDown = this._onBackgroundMouseDown.bind(this);
        this.onMouseMove = this._onMouseMove.bind(this);
        this.onMouseUp = this._onMouseUp.bind(this);
        this.addControlPoint = this._addControlPoint.bind(this);
        this.props.updateCurveFunction(this._cubicSplinesInterpolation.bind(this));
        shortcuts.off(['del']);
        shortcuts.on(['del'], this._deleteControlPoint.bind(this));
    }

    componentWillUnmount() {
        shortcuts.off(['del']);
        shortcuts.on(['del'], () => {svgCanvas.deleteSelectedElements()});
    }

    _cubicSplinesInterpolation(x) {
        //ref: http://blog.ivank.net/interpolation-with-cubic-splines.html
        const ps = this.state.controlPoints;
        const ks = this.ks;
        let i = 0;
        while (i < ps.length) {
            if (ps[i].x >= x) {
                break;
            }
            i += 1;
        }
        let q;
        if (i === 0) {
            q = ps[0].y;
        } else if (i === ps.length) {
            q = ps[ps.length - 1].y;
        } else {
            let t = (x - ps[i-1].x) / (ps[i].x - ps[i-1].x);
            let a = ks[i-1] * (ps[i].x - ps[i-1].x) - (ps[i].y - ps[i-1].y);
            let b = -ks[i] * (ps[i].x - ps[i-1].x) + (ps[i].y - ps[i-1].y);

            q = (1 - t) * ps[i-1].y + t * ps[i].y + t * (1 - t) * (a * (1 - t) + b * t);
        }
        q = Math.min(255, Math.max(0, q));
        return q;
    }

    _genCubicSplineKs() {
        //ps should be sorted
        let ps = this.state.controlPoints;
        const n = ps.length;
        const A = Array.from(Array(n), () => Array(n).fill(0));
        const B = Array(n).fill(0);
        for (let i = 1; i < n-1; i++) {
            A[i][i-1] = 1 / (ps[i].x - ps[i-1].x);
            A[i][i] = 2 * (1 / (ps[i].x - ps[i-1].x) + 1 / (ps[i+1].x - ps[i].x));
            A[i][i+1] = 1 / (ps[i+1].x - ps[i].x);

            B[i] = 3 * ( (ps[i].y - ps[i-1].y) / ((ps[i].x - ps[i-1].x) * (ps[i].x - ps[i-1].x))  +  (ps[i+1].y - ps[i].y) / ((ps[i+1].x - ps[i].x) * (ps[i+1].x - ps[i].x)));
        }

        A[0][0] = 2 / (ps[1].x - ps[0].x);
        A[0][1] = 1 / (ps[1].x - ps[0].x);
        B[0] = 3 * (ps[1].y - ps[0].y) / ((ps[1].x - ps[0].x) * (ps[1].x - ps[0].x));

        A[n-1][n-2] = 1 / (ps[n-1].x - ps[n-2].x);
        A[n-1][n-1] = 2 / (ps[n-1].x - ps[n-2].x);
        B[n-1] = 3 * (ps[n-1].y - ps[n-2].y) / ((ps[n-1].x - ps[n-2].x) * (ps[n-1].x - ps[n-2].x));

        const ks = this._solveKs(A, B);
        this.ks = ks;
        return ks;
    }

    _solveKs(A, B) {
        //Ak = B given A, B solve k using Ｇaussian Elimination
        let n = B.length;
        for(let i = 0; i < n; i++)
        {
            let i_max = i;
            let vali = Number.NEGATIVE_INFINITY;
            for(let j = i; j < n; j++) {
                if(Math.abs(A[j][i]) > vali) {
                    i_max = j; vali = Math.abs(A[j][i]);
                }
            }
            let p = A[i];
            A[i] = A[i_max];
            A[i_max] = p;
            p = B[i];
            B[i] = B[i_max];
            B[i_max] = p;
            
            if(A[i][i] == 0){
                console.log("matrix is singular!");
            }

            for(let j = i+1; j < n; j++)
            {
                let cf = (A[j][i] / A[i][i]);
                for(let k = i; k < n; k++) {
                    A[j][k] -= A[i][k] * cf;
                }
                B[j] -= B[i] * cf;
            }
        }
        //console.log(A);
        //console.log(B);
        let ks = new Array(n).fill(0);
        for(let i = n-1; i >=0 ; i--)
        {
            let v = B[i] / A[i][i];
            ks[i] = v;
            for(let j=i-1; j>=0; j--)
            {
                B[j] -= A[j][i] * v;
                A[j][i] = 0;
            }
        }
        //console.log(ks);
        return ks;
    }

    _onBackgroundMouseDown(e) {
        if ($(e.target).is('rect')) {
            this.dragging = parseInt(e.target.id);
            this.startPoint = {x: e.clientX, y: e.clientY};
            this.originalPos = {...this.state.controlPoints[e.target.id]};
            this.setState({selectingIndex: this.dragging})
        } else {
            this.setState({selectingIndex: null})
        }
    }

    _onMouseMove(e) {
        if (this.dragging != null) {
            const dX = e.clientX - this.startPoint.x;
            const dY = e.clientY - this.startPoint.y;
            let x = Math.min(255, Math.max(0, this.originalPos.x + dX));
            let y = Math.min(255, Math.max(0, this.originalPos.y - dY));
            if (this.dragging > 0 && x <= this.state.controlPoints[this.dragging - 1].x) {
                if (x === this.state.controlPoints[this.dragging - 1].x) {
                    x += 1;
                } else {
                    let p = this.state.controlPoints[this.dragging];
                    this.state.controlPoints[this.dragging] = this.state.controlPoints[this.dragging - 1];
                    this.state.controlPoints[this.dragging - 1] = p;
                    this.dragging -= 1;
                    this.state.selectingIndex -= 1;
                }
            } else if (this.dragging < this.state.controlPoints.length - 1 && x >= this.state.controlPoints[this.dragging + 1].x) {
                if (x === this.state.controlPoints[this.dragging + 1].x) {
                    x -= 1;
                } else {
                    let p = this.state.controlPoints[this.dragging];
                    this.state.controlPoints[this.dragging] = this.state.controlPoints[this.dragging + 1];
                    this.state.controlPoints[this.dragging + 1] = p;
                    this.dragging += 1;
                    this.state.selectingIndex += 1;
                }
            }
            this.state.controlPoints[this.dragging] = {x, y};

            this.setState({controlPoints: [...this.state.controlPoints]});
        }
    }

    _onMouseUp(e) {
        if (this.dragging != null) {
            this.props.updateImage();
        }
        this.dragging = null;
    }

    _renderCurve() {
        let ps = this.state.controlPoints;
        let d = `M 0,${255 - ps[0].y} `
        for (let x = ps[0].x; x < ps[ps.length-1].x; x+= 0.5) {
            const y = this._cubicSplinesInterpolation(x);
            d += `L ${x},${255 - y} ` 
        }
        d += `L ${ps[ps.length-1].x},${255 - ps[ps.length-1].y} L 256,${255 - ps[ps.length-1].y}`
        return ([
            <path key='show' stroke="#000000" fill="none" d={d} >
            </path>,
            <path key='invisible' stroke="transparent" fill="none" strokeWidth="7" d={d} onClick={this.addControlPoint}>
            </path>
        ]);
    }

    _renderControlPoints() {
        let items = [];
        this.state.controlPoints.forEach( (p, index) => {
            const fillOpacity = index === this.state.selectingIndex ? 1 : 0;
            items.push(
                <rect
                    id={index}
                    key={index}
                    fillOpacity={fillOpacity}
                    fill='#000000'
                    stroke='#000000'
                    x={p.x - 3}
                    y={255 - p.y - 3}
                    width={6}
                    height={6}
                >
                </rect>
            )
        });
        return items;
    }

    _addControlPoint(e) {
        if (this.dragging != null) {
            return;
        }
        let px = e.clientX - Math.round($('.curve-control-svg').position().left);
        px = Math.min(255, Math.max(0, px));
        const py = Math.round(this._cubicSplinesInterpolation(px));
        this.state.controlPoints.push({x: px, y: py});
        this.state.controlPoints.sort((a, b) => {
            return a.x - b.x;
        });
        this.setState({
            selectingIndex: null,
            controlPoints: [...this.state.controlPoints]
        });
    }

    _deleteControlPoint() {
        if (this.state.selectingIndex != null && this.state.controlPoints.length > 2) {
            this.state.controlPoints.splice(this.state.selectingIndex, 1);
            this.props.updateImage();
            this.setState({selectingIndex: null});
        }
    }

    render() {
        this._genCubicSplineKs();
        const curve = this._renderCurve();
        const controlPointsRects = this._renderControlPoints();
        return (
            <div className='curve-control-container'>
                <svg className='curve-control-svg'
                    onMouseDown={this.onBackgroundMouseDown}
                    onMouseMove={this.onMouseMove}
                    onMouseUp={this.onMouseUp}
                    onMouseLeave={this.onMouseUp}
                >
                    {curve}
                    {controlPointsRects}
                </svg>
            </div>
        );
    }
};
