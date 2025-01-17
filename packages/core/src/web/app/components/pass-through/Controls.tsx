import classNames from 'classnames';
import React, { useCallback, useContext, useMemo } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import { sprintf } from 'sprintf-js';

import browser from 'implementations/browser';
import constant from 'app/actions/beambox/constant';
import storage from 'implementations/storage';
import UnitInput from 'app/widgets/UnitInput';
import useI18n from 'helpers/useI18n';
import workareaManager from 'app/svgedit/workarea';

import styles from './PassThrough.module.scss';
import { PassThroughContext } from './PassThroughContext';

const Controls = (): JSX.Element => {
  const lang = useI18n().pass_through;

  const {
    workarea,
    workareaObj,
    passThroughHeight,
    setPassThroughHeight,
    referenceLayer,
    setReferenceLayer,
    guideMark,
    setGuideMark,
  } = useContext(PassThroughContext);

  const { max, min } = useMemo(
    () => ({
      max: workareaObj.passThroughMaxHeight ?? workareaObj.height,
      min: 120,
    }),
    [workareaObj]
  );
  const handleWorkareaHeightChange = useCallback(
    (val) => {
      setPassThroughHeight(Math.max(min, Math.min(val, max)));
    },
    [max, min, setPassThroughHeight]
  );

  const { show, x: guideMarkX, width: guideMarkWidth } = guideMark;
  const { xMax, xMin, widthMax } = useMemo(
    () => ({
      xMax: workareaObj.width - guideMarkWidth / 2,
      xMin: guideMarkWidth / 2,
      widthMax: (workareaObj.width - guideMarkX) * 2,
    }),
    [workareaObj.width, guideMarkX, guideMarkWidth]
  );
  const setX = useCallback(
    (val) => {
      setGuideMark((cur) => ({
        ...cur,
        x: Math.max(xMin, Math.min(val, xMax)),
      }));
    },
    [xMax, xMin, setGuideMark]
  );
  const setWidth = useCallback(
    (val) => {
      setGuideMark((cur) => ({
        ...cur,
        width: Math.max(0, Math.min(val, widthMax)),
      }));
    },
    [widthMax, setGuideMark]
  );

  const isInch = useMemo(() => storage.get('default-units') === 'inches', []);
  const objectSize = useMemo(() => {
    const svgcontent = document.getElementById('svgcontent') as unknown as SVGSVGElement;
    if (!svgcontent) return { width: 0, height: 0 };
    const bbox = svgcontent.getBBox();
    let { height } = bbox;
    if (bbox.y + height > workareaManager.height) height = workareaManager.height - bbox.y;
    if (bbox.y < 0) height += bbox.y;
    return {
      width: Math.round((bbox.width / constant.dpmm / (isInch ? 25.4 : 1)) * 100) / 100,
      height: Math.round((height / constant.dpmm / (isInch ? 25.4 : 1)) * 100) / 100,
    };
  }, [isInch]);
  return (
    <div className={styles.controls}>
      {lang.help_links[workarea] && (
        <div className={styles.link} onClick={() => browser.open(lang.help_links[workarea])}>
          {sprintf(lang.help_text, { model: workareaObj.label })}
        </div>
      )}
      <div className={styles.size}>
        <div>
          {lang.object_length}
          <span className={styles.bold}>
            {objectSize.height} {isInch ? 'in' : 'mm'}
          </span>
        </div>
        <div>
          {lang.workarea_height}
          <UnitInput
            className={styles.input}
            value={passThroughHeight}
            onChange={handleWorkareaHeightChange}
            max={max}
            min={min}
            addonAfter={isInch ? 'in' : 'mm'}
            isInch={isInch}
            controls={false}
          />
          <Tooltip
            overlayClassName={styles.tooltip}
            title={`${lang.height_desc}\n(${
              isInch
                ? `${(min / 25.4).toFixed(2)}' ~ ${(max / 25.4).toFixed(2)}'`
                : `${min}mm ~ ${max}mm`
            })`}
          >
            <QuestionCircleOutlined className={styles.hint} />
          </Tooltip>
        </div>
      </div>
      <div className={styles.options}>
        <div className={styles.row}>
          <div className={classNames(styles.cell, styles.title)}>{lang.ref_layer}</div>
          <div className={styles.cell}>
            <Switch
              disabled={objectSize.width === 0 || objectSize.height === 0}
              checked={referenceLayer}
              onChange={() => setReferenceLayer((val) => !val)}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={classNames(styles.cell, styles.title)}>{lang.guide_mark}</div>
          <div className={styles.cell}>
            <Switch
              disabled={objectSize.width === 0 || objectSize.height === 0}
              checked={show}
              onChange={(val) => setGuideMark((cur) => ({ ...cur, show: val }))}
            />
          </div>
        </div>
        {show && (
          <>
            <div className={styles.row}>
              <div className={classNames(styles.cell, styles.title)}>{lang.guide_mark_length}</div>
              <div className={styles.cell}>
                <UnitInput
                  className={styles.input}
                  value={guideMarkWidth}
                  onChange={setWidth}
                  max={widthMax}
                  min={0}
                  addonAfter={isInch ? 'in' : 'mm'}
                  isInch={isInch}
                  controls={false}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={classNames(styles.cell, styles.title)}>{lang.guide_mark_x}</div>
              <div className={styles.cell}>
                <UnitInput
                  className={styles.input}
                  value={guideMarkX}
                  onChange={setX}
                  max={xMax}
                  min={xMin}
                  addonAfter={isInch ? 'in' : 'mm'}
                  isInch={isInch}
                  controls={false}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <div className={styles.hint}>
        <div>1. {lang.ref_layer_desc}</div>
        <br />
        <div>2. {lang.guide_mark_desc}</div>
      </div>
    </div>
  );
};

export default Controls;
