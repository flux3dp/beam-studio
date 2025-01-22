import React, { useCallback, useMemo, useRef, useState } from 'react';

import { Button, Col, InputNumber, Modal, Row, Segmented } from 'antd';
import classNames from 'classnames';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import useI18n from '@core/helpers/useI18n';
import type { CurveMeasurer } from '@core/interfaces/CurveMeasurer';
import type { BBox, MeasureData } from '@core/interfaces/ICurveEngraving';

import browser from '@app/implementations/browser';

import styles from './MeasureArea.module.scss';
import rangeGenerator from './rangeGenerator';

enum Type {
  Amount = 1,
  Gap = 2,
}

interface Props {
  bbox: BBox;
  measurer: CurveMeasurer;
  onCancel: () => void;
  onFinished: (data: MeasureData) => void;
}

// TODO: Add unit tests
const MeasureArea = ({ bbox: { height, width, x, y }, measurer, onCancel, onFinished }: Props): React.JSX.Element => {
  const lang = useI18n();
  const [selectedType, setSelectedType] = useState(Type.Amount);
  const [row, setRow] = useState(12);
  const [column, setColumn] = useState(8);
  const [rowGap, setRowGap] = useState(Math.round(width / 10));
  const [columnGap, setColumnGap] = useState(Math.round(height / 10));
  const [objectHeight, setObjectHeight] = useState(10); // [mm]
  const canceledRef = useRef(false);
  const [cancelling, setCancelling] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [finishedPoints, setFinishedPoints] = useState<number>(0);
  const [progressText, setProgressText] = useState('');
  const xRange = useMemo(() => {
    if (selectedType === Type.Amount) {
      return rangeGenerator.countRangeGenerator(x, x + width, column);
    }

    return rangeGenerator.stepRangeGenerator(x, x + width, columnGap);
  }, [x, width, column, columnGap, selectedType]);
  const yRange = useMemo(() => {
    if (selectedType === Type.Amount) {
      return rangeGenerator.countRangeGenerator(y, y + height, row);
    }

    return rangeGenerator.stepRangeGenerator(y, y + height, rowGap);
  }, [y, height, row, rowGap, selectedType]);

  const checkAndUpdate = useCallback((newVal, setState) => {
    setState((cur: number) => {
      if (Number.isNaN(Number(newVal)) || !newVal) {
        return cur;
      }

      return newVal;
    });
  }, []);

  const handleStartMeasuring = async () => {
    if (isMeasuring) {
      return;
    }

    canceledRef.current = false;
    setCancelling(false);
    setIsMeasuring(true);
    setFinishedPoints(0);

    const data = await measurer.measureArea(xRange, yRange, objectHeight, {
      checkCancel: () => canceledRef.current,
      onPointFinished: setFinishedPoints,
      onProgressText: setProgressText,
    });

    if (!data) {
      setIsMeasuring(false);

      return;
    }

    onFinished(data);
  };

  const handleCancel = useCallback(() => {
    canceledRef.current = true;
    setProgressText(lang.message.cancelling);
    setCancelling(true);
  }, [lang]);

  return (
    <Modal
      centered
      closable={false}
      footer={
        isMeasuring
          ? [
              <Button disabled={cancelling} key="cancel" onClick={handleCancel}>
                {lang.alert.cancel}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel}>
                {lang.curve_engraving.reselect_area}
              </Button>,
              <Button key="start" onClick={handleStartMeasuring} type="primary">
                {lang.curve_engraving.start_autofocus}
              </Button>,
            ]
      }
      maskClosable={false}
      open
      title={lang.curve_engraving.measure_audofocus_area}
      width={540}
    >
      <div className={styles.points}>
        {yRange.map((yValue, yIdx) => (
          <div className={styles.row} key={yIdx}>
            {xRange.map((xValue, xIdx) => (
              <div
                className={classNames(styles.point, {
                  [styles.finished]: isMeasuring && finishedPoints > yIdx * xRange.length + xIdx,
                })}
                key={`${yIdx}-${xIdx}`}
              />
            ))}
          </div>
        ))}
      </div>
      {!isMeasuring && (
        <>
          <div className={styles.controls}>
            <Col span={24}>
              <Row gutter={[48, 0]} justify="center">
                <Col className={styles.col} span={12}>
                  <Row align="middle" gutter={[0, 12]} justify="space-around">
                    <Col span={24}>
                      <Segmented
                        block
                        onChange={(v: Type) => setSelectedType(v)}
                        options={[
                          { label: lang.curve_engraving.amount, value: Type.Amount },
                          { label: lang.curve_engraving.gap, value: Type.Gap },
                        ]}
                      />
                    </Col>
                    <Col span={12}>
                      {selectedType === Type.Amount ? lang.curve_engraving.rows : lang.curve_engraving.gap}
                    </Col>
                    <Col span={12}>
                      <InputNumber<number>
                        addonAfter={selectedType === Type.Amount ? undefined : 'mm'}
                        min={selectedType === Type.Amount ? 2 : 1}
                        onChange={(val) => checkAndUpdate(val, selectedType === Type.Amount ? setRow : setRowGap)}
                        precision={0}
                        step={1}
                        type="number"
                        value={selectedType === Type.Amount ? row : rowGap}
                      />
                    </Col>
                    <Col span={12}>
                      {selectedType === Type.Amount ? lang.curve_engraving.coloumns : lang.curve_engraving.column_gap}
                    </Col>
                    <Col span={12}>
                      <InputNumber<number>
                        addonAfter={selectedType === Type.Amount ? undefined : 'mm'}
                        min={selectedType === Type.Amount ? 2 : 1}
                        onChange={(val) => checkAndUpdate(val, selectedType === Type.Amount ? setColumn : setColumnGap)}
                        precision={0}
                        step={1}
                        type="number"
                        value={selectedType === Type.Amount ? column : columnGap}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col className={styles.col} span={12}>
                  <Row align="middle" gutter={[0, 12]}>
                    <Col className={styles.title} span={24}>
                      {lang.curve_engraving.set_object_height}
                    </Col>
                    <Col className={styles.info} span={24}>
                      {lang.curve_engraving.set_object_height_desc}
                    </Col>
                    <Col span={12}>
                      <InputNumber<number>
                        addonAfter="mm"
                        min={0}
                        onChange={(val) => checkAndUpdate(val, setObjectHeight)}
                        precision={0}
                        step={1}
                        type="number"
                        value={objectHeight}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </div>
          <button
            className={styles.link}
            onClick={() => browser.open(lang.curve_engraving.help_center_url)}
            type="button"
          >
            {lang.alert.learn_more}
          </button>
        </>
      )}
      {isMeasuring && <div>{progressText}</div>}
    </Modal>
  );
};

export default MeasureArea;

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
