import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { CurveMeasurer } from '@core/interfaces/CurveMeasurer';
import type { BBox, MeasureData } from '@core/interfaces/ICurveEngraving';

import CurveEngraving from './CurveEngraving';
import MeasureArea from './MeasureArea';

export const showCurveEngraving = async (): Promise<void> => {
  if (!isIdExist('curve-engraving')) {
    return new Promise<void>((resolve) => {
      addDialogComponent(
        'curve-engraving',
        <CurveEngraving
          onClose={() => {
            popDialogById('curve-engraving');
            resolve();
          }}
        />,
      );
    });
  }

  return Promise.resolve();
};

export const showMeasureArea = (bbox: BBox, measurer: CurveMeasurer): Promise<MeasureData | null> => {
  if (isIdExist('measure-area')) {
    popDialogById('measure-area');
  }

  return new Promise<MeasureData | null>((resolve) => {
    addDialogComponent(
      'measure-area',
      <MeasureArea
        bbox={bbox}
        measurer={measurer}
        onCancel={() => {
          resolve(null);
          popDialogById('measure-area');
        }}
        onFinished={(data) => {
          resolve(data);
          popDialogById('measure-area');
        }}
      />,
    );
  });
};
