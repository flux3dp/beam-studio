import React, { use, useCallback, useEffect, useMemo } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import { sprintf } from 'sprintf-js';

import constant, { dpmm } from '@core/app/actions/beambox/constant';
import { useStorageStore } from '@core/app/stores/storageStore';
import workareaManager from '@core/app/svgedit/workarea';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './PassThrough.module.scss';
import { PassThroughContext } from './PassThroughContext';

const Controls = (): React.JSX.Element => {
  const lang = useI18n().pass_through;

  const {
    addOnInfo,
    guideMark,
    passThroughHeight,
    referenceLayer,
    setGuideMark,
    setPassThroughHeight,
    setReferenceLayer,
    workarea,
    workareaObj,
  } = use(PassThroughContext);

  const { max, min } = useMemo(
    () => ({
      max: addOnInfo.passThrough?.maxHeight ?? workareaObj.height,
      min: 120,
    }),
    [addOnInfo, workareaObj],
  );
  const handleWorkareaHeightChange = useCallback(
    (val: null | number) => {
      if (val === null) return;

      setPassThroughHeight(Math.max(min, Math.min(val, max)));
    },
    [max, min, setPassThroughHeight],
  );

  const { show, width: guideMarkWidth, x: guideMarkX } = guideMark;
  const { widthMax, xMax, xMin } = useMemo(() => {
    const bottomPadding = (workareaObj.height - passThroughHeight) / 2;
    const topPadding = bottomPadding - (addOnInfo.passThrough?.minY ?? 0) / dpmm;

    return {
      widthMax: Math.min(
        (workareaObj.width - guideMarkX) * 2,
        Math.floor(((topPadding + bottomPadding) * Math.sqrt(3)) / 2),
      ),
      xMax: workareaObj.width - guideMarkWidth / 2,
      xMin: guideMarkWidth / 2,
    };
  }, [workareaObj.width, workareaObj.height, guideMarkX, guideMarkWidth, passThroughHeight, addOnInfo]);

  useEffect(() => {
    if (guideMarkWidth > widthMax) {
      setGuideMark((cur) => ({ ...cur, width: widthMax }));
    }
  }, [widthMax, guideMarkWidth, setGuideMark]);

  const setX = useCallback(
    (val: null | number) => {
      if (val === null) return;

      setGuideMark((cur) => ({
        ...cur,
        x: Math.max(xMin, Math.min(val, xMax)),
      }));
    },
    [xMax, xMin, setGuideMark],
  );
  const setWidth = useCallback(
    (val: null | number) => {
      if (val === null) return;

      setGuideMark((cur) => ({
        ...cur,
        width: Math.max(0, Math.min(val, widthMax)),
      }));
    },
    [widthMax, setGuideMark],
  );

  const isInch = useStorageStore((state) => state.isInch);
  const objectSize = useMemo(() => {
    const svgcontent = document.getElementById('svgcontent') as unknown as SVGSVGElement;

    if (!svgcontent) {
      return { height: 0, width: 0 };
    }

    const bbox = svgcontent.getBBox();
    let { height } = bbox;

    if (bbox.y + height > workareaManager.height) {
      height = workareaManager.height - bbox.y;
    }

    if (bbox.y < 0) {
      height += bbox.y;
    }

    return {
      height: Math.round((height / constant.dpmm / (isInch ? 25.4 : 1)) * 100) / 100,
      width: Math.round((bbox.width / constant.dpmm / (isInch ? 25.4 : 1)) * 100) / 100,
    };
  }, [isInch]);

  return (
    <div className={styles.controls}>
      {lang.help_links[workarea as keyof typeof lang.help_links] && (
        <div
          className={styles.link}
          onClick={() => browser.open(lang.help_links[workarea as keyof typeof lang.help_links])}
        >
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
            addonAfter={isInch ? 'in' : 'mm'}
            className={styles.input}
            controls={false}
            isInch={isInch}
            max={max}
            min={min}
            onChange={handleWorkareaHeightChange}
            value={passThroughHeight}
          />
          <Tooltip
            className={styles.tooltip}
            title={`${lang.height_desc}\n(${
              isInch ? `${(min / 25.4).toFixed(2)}' ~ ${(max / 25.4).toFixed(2)}'` : `${min}mm ~ ${max}mm`
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
              checked={referenceLayer}
              disabled={objectSize.width === 0 || objectSize.height === 0}
              onChange={() => setReferenceLayer((val) => !val)}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={classNames(styles.cell, styles.title)}>{lang.guide_mark}</div>
          <div className={styles.cell}>
            <Switch
              checked={show}
              disabled={objectSize.width === 0 || objectSize.height === 0}
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
                  addonAfter={isInch ? 'in' : 'mm'}
                  className={styles.input}
                  controls={false}
                  isInch={isInch}
                  max={widthMax}
                  min={0}
                  onChange={setWidth}
                  value={guideMarkWidth}
                />
              </div>
            </div>
            <div className={styles.row}>
              <div className={classNames(styles.cell, styles.title)}>{lang.guide_mark_x}</div>
              <div className={styles.cell}>
                <UnitInput
                  addonAfter={isInch ? 'in' : 'mm'}
                  className={styles.input}
                  controls={false}
                  isInch={isInch}
                  max={xMax}
                  min={xMin}
                  onChange={setX}
                  value={guideMarkX}
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
