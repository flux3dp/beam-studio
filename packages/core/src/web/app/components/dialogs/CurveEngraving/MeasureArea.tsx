/* eslint-disable no-await-in-loop */
/* eslint-disable react/no-array-index-key */
import classNames from 'classnames';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Col, Modal, InputNumber, Row, Segmented } from 'antd';

import browser from 'implementations/browser';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { BBox, MeasureData } from 'interfaces/ICurveEngraving';
import { CurveMeasurer } from 'interfaces/CurveMeasurer';

import rangeGenerator from './rangeGenerator';
import styles from './MeasureArea.module.scss';

enum Type {
  Amount = 1,
  Gap = 2,
}

interface Props {
  bbox: BBox;
  measurer: CurveMeasurer;
  onFinished: (data: MeasureData) => void;
  onCancel: () => void;
}

// TODO: Add unit tests
const MeasureArea = ({
  bbox: { x, y, width, height },
  measurer,
  onFinished,
  onCancel,
}: Props): JSX.Element => {
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
    if (selectedType === Type.Amount)
      return rangeGenerator.countRangeGenerator(x, x + width, column);
    return rangeGenerator.stepRangeGenerator(x, x + width, columnGap);
  }, [x, width, column, columnGap, selectedType]);
  const yRange = useMemo(() => {
    if (selectedType === Type.Amount) return rangeGenerator.countRangeGenerator(y, y + height, row);
    return rangeGenerator.stepRangeGenerator(y, y + height, rowGap);
  }, [y, height, row, rowGap, selectedType]);

  const checkAndUpdate = useCallback((newVal, setState) => {
    setState((cur: number) => {
      if (Number.isNaN(Number(newVal)) || !newVal) return cur;
      return newVal;
    });
  }, []);

  const handleStartMeasuring = async () => {
    if (isMeasuring) return;
    canceledRef.current = false;
    setCancelling(false);
    setIsMeasuring(true);
    setFinishedPoints(0);
    const data = await measurer.measureArea(xRange, yRange, objectHeight, {
      onProgressText: setProgressText,
      onPointFinished: setFinishedPoints,
      checkCancel: () => canceledRef.current,
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
      title={lang.curve_engraving.measure_audofocus_area}
      open
      centered
      closable={false}
      width={540}
      maskClosable={false}
      footer={
        isMeasuring
          ? [
              <Button key="cancel" disabled={cancelling} onClick={handleCancel}>
                {lang.alert.cancel}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel}>
                {lang.curve_engraving.reselect_area}
              </Button>,
              <Button key="start" type="primary" onClick={handleStartMeasuring}>
                {lang.curve_engraving.start_autofocus}
              </Button>,
            ]
      }
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
                  <Row gutter={[0, 12]} justify="space-around" align="middle">
                    <Col span={24}>
                      <Segmented
                        block
                        options={[
                          { value: Type.Amount, label: lang.curve_engraving.amount },
                          { value: Type.Gap, label: lang.curve_engraving.gap },
                        ]}
                        onChange={(v: Type) => setSelectedType(v)}
                      />
                    </Col>
                    <Col span={12}>
                      {selectedType === Type.Amount
                        ? lang.curve_engraving.rows
                        : lang.curve_engraving.gap}
                    </Col>
                    <Col span={12}>
                      <InputNumber<number>
                        type="number"
                        value={selectedType === Type.Amount ? row : rowGap}
                        min={selectedType === Type.Amount ? 2 : 1}
                        onChange={(val) =>
                          checkAndUpdate(val, selectedType === Type.Amount ? setRow : setRowGap)
                        }
                        step={1}
                        precision={0}
                        addonAfter={selectedType === Type.Amount ? undefined : 'mm'}
                      />
                    </Col>
                    <Col span={12}>
                      {selectedType === Type.Amount
                        ? lang.curve_engraving.coloumns
                        : lang.curve_engraving.column_gap}
                    </Col>
                    <Col span={12}>
                      <InputNumber<number>
                        type="number"
                        value={selectedType === Type.Amount ? column : columnGap}
                        min={selectedType === Type.Amount ? 2 : 1}
                        onChange={(val) =>
                          checkAndUpdate(
                            val,
                            selectedType === Type.Amount ? setColumn : setColumnGap
                          )
                        }
                        step={1}
                        precision={0}
                        addonAfter={selectedType === Type.Amount ? undefined : 'mm'}
                      />
                    </Col>
                  </Row>
                </Col>
                <Col className={styles.col} span={12}>
                  <Row gutter={[0, 12]} align="middle">
                    <Col className={styles.title} span={24}>
                      {lang.curve_engraving.set_object_height}
                    </Col>
                    <Col className={styles.info} span={24}>
                      {lang.curve_engraving.set_object_height_desc}
                    </Col>
                    <Col span={12}>
                      <InputNumber<number>
                        type="number"
                        value={objectHeight}
                        min={0}
                        onChange={(val) => checkAndUpdate(val, setObjectHeight)}
                        step={1}
                        precision={0}
                        addonAfter="mm"
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </div>
          <button
            className={styles.link}
            type="button"
            onClick={() => browser.open(lang.curve_engraving.help_center_url)}
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

export const showMeasureArea = (
  bbox: BBox,
  measurer: CurveMeasurer
): Promise<MeasureData | null> => {
  if (isIdExist('measure-area')) popDialogById('measure-area');
  return new Promise<MeasureData | null>((resolve) => {
    addDialogComponent(
      'measure-area',
      <MeasureArea
        bbox={bbox}
        measurer={measurer}
        onFinished={(data) => {
          resolve(data);
          popDialogById('measure-area');
        }}
        onCancel={() => {
          resolve(null);
          popDialogById('measure-area');
        }}
      />
    );
  });
};
