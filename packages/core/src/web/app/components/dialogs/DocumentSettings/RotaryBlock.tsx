import type { ReactNode } from 'react';
import React, { memo } from 'react';

import { SettingFilled } from '@ant-design/icons';
import { Segmented, Switch } from 'antd';
import classNames from 'classnames';
import { useShallow } from 'zustand/shallow';

import { showRotarySettings } from '@core/app/components/dialogs/RotarySettings';
import type { AddOnInfo } from '@core/app/constants/addOn';
import { RotaryType } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';

interface Props {
  addOnInfo: AddOnInfo;
  borderless: boolean;
  isCurveEngraving: boolean;
  lengthDisplay: (length: number) => string;
  renderWarningIcon: (tooltipText: string) => ReactNode;
  rotaryMode: boolean;
  rotaryType: RotaryType;
  setBorderless: (borderless: boolean) => void;
  setRotaryMode: (mode: boolean) => void;
  setRotaryType: (type: RotaryType) => void;
  workarea: WorkAreaModel;
}

const RotaryBlock = memo(
  ({
    addOnInfo,
    borderless,
    isCurveEngraving,
    lengthDisplay,
    renderWarningIcon,
    rotaryMode,
    rotaryType,
    setBorderless,
    setRotaryMode,
    setRotaryType,
    workarea,
  }: Props) => {
    const {
      beambox: { document_panel: tDocument },
      global: tGlobal,
    } = useI18n();
    const { chunkDiameter, rotaryScale } = useDocumentStore(
      useShallow((state) => ({
        chunkDiameter: state['rotary-chuck-obj-d'],
        rotaryScale: state['rotary-scale'],
      })),
    );

    const renderRotarySettingsIcon = () => {
      return (
        <SettingFilled
          className={styles.icon}
          onClick={() =>
            showRotarySettings({ rotaryMode, rotaryType, workarea }, () => {
              setRotaryMode(useDocumentStore.getState().rotary_mode);
              setRotaryType(useDocumentStore.getState()['rotary-type']);
            })
          }
        />
      );
    };

    if (!addOnInfo.rotary) return null;

    return (
      <>
        <div className={styles.block}>
          <div className={styles.row}>
            <div className={styles.title}>
              <label htmlFor="rotaryMaster">
                <strong>{tDocument.rotary_mode}</strong>
              </label>
              {!addOnInfo.rotary.chuck && renderRotarySettingsIcon()}
              {renderWarningIcon(tGlobal.mode_conflict)}
            </div>
            <div className={styles.control}>
              <Switch
                checked={rotaryMode}
                disabled={!addOnInfo.rotary || isCurveEngraving}
                id="rotaryMaster"
                onChange={(on: boolean) => {
                  setRotaryMode(on);

                  if (addOnInfo.openBottom) setBorderless(false);
                }}
              />
            </div>
          </div>
          {rotaryMode && addOnInfo.rotary.chuck && (
            <>
              <div className={classNames(styles.row, styles.full)}>
                <Segmented
                  className={styles.segmented}
                  id="rotaryModeSelect"
                  onChange={(val) => setRotaryType(val as RotaryType)}
                  options={[
                    { label: 'Roller', value: RotaryType.Roller },
                    { label: 'Chuck', value: RotaryType.Chuck },
                  ]}
                  value={rotaryType}
                />
                <div className={styles.sub}>
                  <div
                    className={classNames(styles.desc, rotaryType === RotaryType.Chuck ? styles.right : styles.left)}
                  >
                    {rotaryType === RotaryType.Chuck
                      ? `Φ: ${lengthDisplay(chunkDiameter)}, Scale: ${rotaryScale}`
                      : `Scale: ${rotaryScale}`}
                    {renderRotarySettingsIcon()}
                  </div>
                </div>
              </div>
              {addOnInfo.openBottom && (
                <div className={styles.row}>
                  <label className={styles.title} htmlFor="rotaryOpenBottom">
                    {tDocument.borderless_mode}
                  </label>
                  <div className={styles.control}>
                    <Switch checked={borderless} id="rotaryOpenBottom" onChange={setBorderless} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </>
    );
  },
);

export default RotaryBlock;
