// ref: http://blog.ivank.net/interpolation-with-cubic-splines.html
import React from 'react';

import shortcuts from '@core/helpers/shortcuts';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';

let svgEditor;

getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

interface IPoint {
  x: number;
  y: number;
}

interface Props {
  updateCurveFunction: (curveFunction: (x: number) => number) => void;
  updateImage: () => void;
}

interface State {
  controlPoints: IPoint[];
  draggingIndex?: number;
  dragStartPoint?: IPoint;
  originalPoint?: IPoint;
  selectingIndex: number;
  splineKs: number[];
}

const isPointEqual = (a: IPoint, b: IPoint) => a.x === b.x && a.y === b.y;

const generateSafePoints = (points: IPoint[]) => {
  const newPoints = JSON.parse(JSON.stringify(points)); // Deep copy

  for (let i = 1; i < newPoints.length; i += 1) {
    if (newPoints[i].x - newPoints[i - 1].x <= 0) {
      newPoints[i].x = newPoints[i - 1].x + 0.001; // Avoid singularity caused by same x value
    }
  }

  return newPoints;
};

const solveX = (matrixA: number[][], matrixB: number[]): number[] => {
  // AX = B given A, B solve X using Ｇaussian Elimination
  const n = matrixB.length;

  for (let i = 0; i < n; i += 1) {
    let iMax = i;
    let vali = Number.NEGATIVE_INFINITY;

    for (let j = i; j < n; j += 1) {
      if (Math.abs(matrixA[j][i]) > vali) {
        iMax = j;
        vali = Math.abs(matrixA[j][i]);
      }
    }

    const swapA = matrixA[i];

    matrixA[i] = matrixA[iMax];
    matrixA[iMax] = swapA;

    const swapB = matrixB[i];

    matrixB[i] = matrixB[iMax];
    matrixB[iMax] = swapB;

    if (matrixA[i][i] === 0) {
      console.log('matrix is singular!');
    }

    for (let j = i + 1; j < n; j += 1) {
      const cf = matrixA[j][i] / matrixA[i][i];

      for (let k = i; k < n; k += 1) {
        matrixA[j][k] -= matrixA[i][k] * cf;
      }
      matrixB[j] -= matrixB[i] * cf;
    }
  }

  const matrixX = Array(n).fill(0);

  for (let i = n - 1; i >= 0; i -= 1) {
    const v = matrixB[i] / matrixA[i][i];

    matrixX[i] = v;
    for (let j = i - 1; j >= 0; j -= 1) {
      matrixB[j] -= matrixA[j][i] * v;
      matrixA[j][i] = 0;
    }
  }

  return matrixX;
};

const generateCubicSplineFromPoints = (points: IPoint[]) => {
  const ps = generateSafePoints(points);
  const n = ps.length;
  const A = Array.from(Array(n), () => Array(n).fill(0));
  const B = Array(n).fill(0);

  for (let i = 1; i < n - 1; i += 1) {
    A[i][i - 1] = 1 / (ps[i].x - ps[i - 1].x);
    A[i][i] = 2 * (1 / (ps[i].x - ps[i - 1].x) + 1 / (ps[i + 1].x - ps[i].x));
    A[i][i + 1] = 1 / (ps[i + 1].x - ps[i].x);

    B[i] =
      3 *
      ((ps[i].y - ps[i - 1].y) / ((ps[i].x - ps[i - 1].x) * (ps[i].x - ps[i - 1].x)) +
        (ps[i + 1].y - ps[i].y) / ((ps[i + 1].x - ps[i].x) * (ps[i + 1].x - ps[i].x)));
  }

  A[0][0] = 2 / (ps[1].x - ps[0].x);
  A[0][1] = 1 / (ps[1].x - ps[0].x);
  B[0] = 3 * ((ps[1].y - ps[0].y) / ((ps[1].x - ps[0].x) * (ps[1].x - ps[0].x)));

  A[n - 1][n - 2] = 1 / (ps[n - 1].x - ps[n - 2].x);
  A[n - 1][n - 1] = 2 / (ps[n - 1].x - ps[n - 2].x);
  B[n - 1] = 3 * ((ps[n - 1].y - ps[n - 2].y) / ((ps[n - 1].x - ps[n - 2].x) * (ps[n - 1].x - ps[n - 2].x)));

  return solveX(A, B);
};

export default class CurveControl extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { updateCurveFunction } = this.props as Props;

    this.state = {
      controlPoints: [
        { x: 0, y: 0 },
        { x: 255, y: 255 },
      ],
      selectingIndex: null,
      splineKs: generateCubicSplineFromPoints([
        { x: 0, y: 0 },
        { x: 255, y: 255 },
      ]),
    };
    updateCurveFunction(this.cubicSplinesInterpolation);
    shortcuts.off(['Delete', 'Backspace']);
    shortcuts.on(['Delete', 'Backspace'], this.deleteControlPoint);
  }

  componentWillUnmount(): void {
    shortcuts.off(['Delete', 'Backspace']);
    shortcuts.on(['Delete', 'Backspace'], () => svgEditor.deleteSelected());
  }

  cubicSplinesInterpolation = (x: number): number => {
    const { controlPoints, splineKs } = this.state as State;
    const ps = generateSafePoints(controlPoints);
    let i = 0;

    while (i < ps.length) {
      if (ps[i].x >= x) {
        break;
      }

      i += 1;
    }

    let q: number;

    if (i === 0) {
      q = ps[0].y;
    } else if (i === ps.length) {
      q = ps[ps.length - 1].y;
    } else {
      const t = (x - ps[i - 1].x) / (ps[i].x - ps[i - 1].x);
      const a = splineKs[i - 1] * (ps[i].x - ps[i - 1].x) - (ps[i].y - ps[i - 1].y);
      const b = -splineKs[i] * (ps[i].x - ps[i - 1].x) + (ps[i].y - ps[i - 1].y);

      q = (1 - t) * ps[i - 1].y + t * ps[i].y + t * (1 - t) * (a * (1 - t) + b * t);
    }

    q = Math.min(255, Math.max(0, q));

    return q;
  };

  onBackgroundMouseDown = (e: React.MouseEvent): void => {
    const { controlPoints } = this.state;
    const target = e.target as Element;

    if (target.tagName === 'rect') {
      const index = Number.parseInt(target.getAttribute('id'), 10);

      this.setState({
        draggingIndex: index,
        dragStartPoint: { x: e.clientX, y: e.clientY },
        originalPoint: { ...controlPoints[index] },
        selectingIndex: index,
      });
    } else {
      this.setState({ selectingIndex: null });
    }
  };

  onMouseMove = (e: React.MouseEvent): void => {
    let { draggingIndex, selectingIndex } = this.state;

    if (typeof draggingIndex === 'number') {
      const { controlPoints, dragStartPoint, originalPoint } = this.state;
      const dX = e.clientX - dragStartPoint.x;
      const dY = e.clientY - dragStartPoint.y;
      let x = Math.min(255, Math.max(0, originalPoint.x + dX));
      const y = Math.min(255, Math.max(0, originalPoint.y - dY));

      if (draggingIndex > 0 && x <= controlPoints[draggingIndex - 1].x) {
        if (x === controlPoints[draggingIndex - 1].x) {
          x += 1;
        } else {
          const p = controlPoints[draggingIndex];

          controlPoints[draggingIndex] = controlPoints[draggingIndex - 1];
          controlPoints[draggingIndex - 1] = p;
          draggingIndex -= 1;
          selectingIndex -= 1;
        }
      } else if (draggingIndex < controlPoints.length - 1 && x >= controlPoints[draggingIndex + 1].x) {
        if (x === controlPoints[draggingIndex + 1].x) {
          x -= 1;
        } else {
          const p = controlPoints[draggingIndex];

          controlPoints[draggingIndex] = controlPoints[draggingIndex + 1];
          controlPoints[draggingIndex + 1] = p;
          draggingIndex += 1;
          selectingIndex += 1;
        }
      }

      controlPoints[draggingIndex] = { x, y };

      this.setState({
        controlPoints: [...controlPoints],
        draggingIndex,
        selectingIndex,
        splineKs: generateCubicSplineFromPoints(controlPoints),
      });
    }
  };

  onMouseUp = (): void => {
    const { draggingIndex } = this.state;

    if (typeof draggingIndex === 'number') {
      const { updateImage } = this.props;

      updateImage();
    }

    this.setState({
      draggingIndex: null,
    });
  };

  renderCurve(): React.JSX.Element[] {
    const { controlPoints: ps } = this.state;
    let d = `M 0,${255 - ps[0].y} `;

    for (let { x } = ps[0]; x < ps[ps.length - 1].x; x += 0.5) {
      const y = this.cubicSplinesInterpolation(x);

      d += `L ${x},${255 - y} `;
    }
    d += `L ${ps[ps.length - 1].x},${255 - ps[ps.length - 1].y} L 256,${255 - ps[ps.length - 1].y}`;

    return [
      <path d={d} fill="none" key="show" stroke="#000000" />,
      <path d={d} fill="none" key="invisible" onClick={this.addControlPoint} stroke="transparent" strokeWidth="7" />,
    ];
  }

  renderControlPoints(): Element[] {
    const items = [];
    const { controlPoints, selectingIndex } = this.state;

    controlPoints.forEach((p: IPoint, index: number) => {
      const fillOpacity = index === selectingIndex ? 1 : 0;

      items.push(
        <rect
          fill="#000000"
          fillOpacity={fillOpacity}
          height={6}
          id={index.toString()}
          key={`${p.x},${p.y}`}
          stroke="#000000"
          width={6}
          x={p.x - 3}
          y={255 - p.y - 3}
        />,
      );
    });

    return items;
  }

  addControlPoint = (e: React.MouseEvent): void => {
    const { controlPoints, draggingIndex } = this.state as State;

    if (typeof draggingIndex === 'number') {
      return;
    }

    const getClosestPoint = (): IPoint => {
      const curveControlSVG = document.querySelector('.curve-control-svg');
      const leftBound = Math.round(curveControlSVG.getBoundingClientRect().left);
      const topBound = Math.round(curveControlSVG.getBoundingClientRect().top);
      const mouseX = Math.round(Math.min(255, Math.max(0, e.clientX - leftBound)));
      const mouseY = Math.min(255, Math.max(0, 255 - (e.clientY - topBound)));
      let y = this.cubicSplinesInterpolation(mouseX);
      let minDist = Math.abs(y - mouseY);
      let minDistPoints = { x: mouseX, y };
      const startX = Math.max(0, Math.ceil(mouseX - minDist));
      const endX = Math.min(255, Math.floor(mouseX + minDist));

      for (let x = startX; x <= endX; x += 1) {
        y = this.cubicSplinesInterpolation(x);

        const dist = Math.hypot(mouseX - x, mouseY - y);

        if (dist < minDist) {
          minDist = dist;
          minDistPoints = { x, y };
        }
      }

      return minDistPoints;
    };

    const clickPoint = getClosestPoint();
    const existingPointIndex = controlPoints.findIndex((p) => isPointEqual(p, clickPoint));

    if (existingPointIndex < 0) {
      controlPoints.push(clickPoint);
      controlPoints.sort((a, b) => a.x - b.x);
      this.setState({
        controlPoints: [...controlPoints],
        selectingIndex: null,
        splineKs: generateCubicSplineFromPoints(controlPoints),
      });
    } else {
      this.setState({
        selectingIndex: existingPointIndex,
      });
    }
  };

  deleteControlPoint = (): void => {
    const { updateImage } = this.props;
    const { controlPoints, selectingIndex } = this.state;

    if (selectingIndex != null && controlPoints.length > 2) {
      controlPoints.splice(selectingIndex, 1);
      updateImage();
      this.setState({
        controlPoints: [...controlPoints],
        selectingIndex: null,
        splineKs: generateCubicSplineFromPoints(controlPoints),
      });
    }
  };

  render(): React.JSX.Element {
    const curve = this.renderCurve();
    const controlPointsRects = this.renderControlPoints();

    return (
      <div
        style={{
          height: 260,
          width: 260,
        }}
      >
        <svg
          className="curve-control-svg"
          onMouseDown={this.onBackgroundMouseDown}
          onMouseLeave={this.onMouseUp}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          style={{
            border: '2px solid #b3b3b3',
            height: 260,
            width: 260,
          }}
        >
          {curve}
          {controlPointsRects}
        </svg>
      </div>
    );
  }
}
