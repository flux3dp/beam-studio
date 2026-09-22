import React, { useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Input, InputNumber, Modal, Select, Tooltip } from 'antd';
import classNames from 'classnames';
import { match } from 'ts-pattern';

import {
  GALVO_DEV_SETTING_FIELDS,
  GALVO_DEV_SETTING_GROUPS,
  type GalvoDevConfigKey,
  type GalvoDevOverrides,
  type GalvoDevSettingField,
} from '@core/app/constants/galvo-dev-settings';
import { galvoModulesArray, LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import type { GalvoModule } from '@core/helpers/device/galvoConfig';
import { getGalvoConfig } from '@core/helpers/device/galvoConfig';
import { getAllOffsets } from '@core/helpers/device/moduleOffsets';
import deviceMaster from '@core/helpers/device-master';

import styles from './index.module.scss';

interface Props {
  onClose: () => void;
}

/**
 * What the machine answered, or why it did not. Kept as one value rather than a pair of
 * nullable fields so "no machine" cannot be mistaken for "a machine that reads zero".
 */
type MachineValues =
  | { lenses: Record<number, number>; offsets: Record<number, [number, number]>; state: 'ready' }
  | { state: 'disconnected' | 'failed' | 'loading' };

const formatDefault = (value: GalvoDevSettingField['default']): string => {
  if (Array.isArray(value)) return value.join(' x ');

  if (typeof value === 'boolean') return value ? '開' : '關';

  return value === '' ? '空白' : String(value);
};

/**
 * Developer overrides for the HEXA II galvo path.
 *
 * A row left alone sends nothing, and swiftray applies its own default -- which is why every
 * control shows that default as a placeholder rather than filling itself in. Pinning the
 * defaults here would mean two copies of every number, free to disagree the moment one side
 * changes. Overridden rows are marked, and Reset removes the override rather than writing the
 * default back.
 */
const GalvoDevSettings = ({ onClose }: Props): React.JSX.Element => {
  const stored = useStorageStore((state) => state['galvo-dev-settings']);
  const setStorage = useStorageStore((state) => state.set);
  const workarea = useDocumentStore((state) => state.workarea);
  const mopaEnabled = useDocumentStore((state) => state['enable-galvo-mopa']);
  const [draft, setDraft] = useState<GalvoDevOverrides>(() => ({ ...stored }));
  const [machine, setMachine] = useState<MachineValues>({ state: 'loading' });

  useEffect(() => {
    let cancelled = false;

    // Both of these live on the machine, and both answer with a plausible-looking default when
    // there is none -- 110 mm, a zero offset. Those are not readings, and showing them as if
    // they were would be worse than showing nothing: a zero offset is exactly what a machine
    // whose head sits on the nozzle would report.
    if (!deviceMaster.currentDevice) {
      setMachine({ state: 'disconnected' });

      return;
    }

    const load = async () => {
      const [all, fields] = await Promise.all([
        getAllOffsets(workarea),
        Promise.all(galvoModulesArray.map((module) => getGalvoConfig(module as GalvoModule))),
      ]);

      if (cancelled) return;

      setMachine({
        lenses: Object.fromEntries(galvoModulesArray.map((module, index) => [module, fields[index].workarea])),
        offsets: all as Record<number, [number, number]>,
        state: 'ready',
      });
    };

    load().catch(() => {
      if (!cancelled) setMachine({ state: 'failed' });
    });

    return () => {
      cancelled = true;
    };
  }, [workarea]);

  const overriddenCount = useMemo(() => Object.keys(draft).length, [draft]);

  const setValue = (key: GalvoDevConfigKey, value: unknown): void =>
    setDraft((previous) => ({ ...previous, [key]: value }) as GalvoDevOverrides);

  const clearValue = (key: GalvoDevConfigKey): void =>
    setDraft((previous) => {
      const next = { ...previous };

      delete next[key];

      return next;
    });

  const renderControl = (field: GalvoDevSettingField): React.JSX.Element => {
    const value = draft[field.key];

    return match(field)
      .with({ kind: 'boolean' }, (f) => (
        // Indeterminate says "not overridden": neither on nor off, whatever swiftray decides.
        <Checkbox
          checked={value === true}
          indeterminate={value === undefined}
          onChange={(event) => setValue(f.key, event.target.checked)}
        >
          {value === undefined ? `預設（${formatDefault(f.default)}）` : ''}
        </Checkbox>
      ))
      .with({ kind: 'number' }, (f) => (
        <InputNumber
          className={styles.control}
          max={f.max}
          min={f.min}
          onChange={(next) => (next === null ? clearValue(f.key) : setValue(f.key, next))}
          placeholder={formatDefault(f.default)}
          step={f.step ?? 1}
          value={value as null | number}
        />
      ))
      .with({ kind: 'pair' }, (f) => {
        const pair = value as [number, number] | undefined;

        return (
          <div className={styles.pair}>
            {([0, 1] as const).map((index) => (
              <InputNumber
                className={styles.control}
                key={index}
                min={0.0001}
                onChange={(next) => {
                  if (next === null) {
                    clearValue(f.key);

                    return;
                  }

                  const base = pair ?? (f.default as [number, number]);

                  setValue(f.key, index === 0 ? [next, base[1]] : [base[0], next]);
                }}
                placeholder={String((f.default as [number, number])[index])}
                step={f.step ?? 1}
                value={pair ? pair[index] : null}
              />
            ))}
          </div>
        );
      })
      .with({ kind: 'select' }, (f) => (
        <Select
          allowClear
          className={styles.control}
          onChange={(next) => (next === undefined ? clearValue(f.key) : setValue(f.key, next))}
          options={f.options}
          placeholder={formatDefault(f.default)}
          value={(value as string | undefined) ?? undefined}
        />
      ))
      .with({ kind: 'text' }, (f) => (
        <Input
          className={styles.control}
          onChange={(event) => {
            const next = event.target.value;

            if (next === '') clearValue(f.key);
            else setValue(f.key, next);
          }}
          placeholder={formatDefault(f.default)}
          value={(value as string | undefined) ?? ''}
        />
      ))
      .exhaustive();
  };

  // Nothing read from the machine can be shown until one has answered, so every row falls back
  // to the same reason rather than to a number.
  const unavailable = match(machine.state)
    .with('loading', () => '讀取中…')
    .with('disconnected', () => '未連線至機器')
    .with('failed', () => '讀取失敗')
    .with('ready', () => '')
    .exhaustive();

  const lensOf = (module: number) => (machine.state === 'ready' ? `${machine.lenses[module]} mm` : unavailable);
  const offsetOf = (module: number) =>
    machine.state === 'ready' ? (machine.offsets[module]?.join(', ') ?? '未設定') : unavailable;

  const readOnlyRows: Array<{ disabled?: boolean; label: string; tooltip: string; value: string }> = [
    {
      label: '場鏡尺寸（CO2）',
      tooltip:
        '這顆模組頭裝的場鏡，來自機器上該模組的振鏡設定。振鏡往兩側各可達一半的距離，' +
        '同時也決定區塊大小以及圖案需不需要分割。要改請到「振鏡設定」，不是這裡。' +
        '實際只會送出這份工作真正用到的那顆頭的值。',
      value: lensOf(LayerModule.GALVO_CO2),
    },
    {
      disabled: !mopaEnabled,
      label: '場鏡尺寸（Mopa）',
      tooltip: mopaEnabled
        ? '同上，Mopa 模組頭的值。'
        : '這份文件沒有啟用 Mopa 模組，所以不會用它雕刻。要看機器上這顆頭的設定，' + '請先在「文件設定」裡開啟。',
      value: mopaEnabled ? lensOf(LayerModule.GALVO_MOPA) : '模組未啟用',
    },
    {
      label: '模組偏移（CO2）',
      tooltip:
        '振鏡鏡頭相對於龍門定位點的距離。分塊是以主雷射頭的座標系劃分的，所以這個值會改變' +
        '圖案落在哪一格。來自機器的 toolhead_shift，和模組校正讀的是同一個地方。',
      value: offsetOf(LayerModule.GALVO_CO2),
    },
    {
      disabled: !mopaEnabled,
      label: '模組偏移（Mopa）',
      tooltip: mopaEnabled ? '同上，Mopa 模組頭的值。' : '這份文件沒有啟用 Mopa 模組。',
      value: mopaEnabled ? offsetOf(LayerModule.GALVO_MOPA) : '模組未啟用',
    },
  ];

  return (
    <Modal
      cancelText="取消"
      centered
      footer={(_, { CancelBtn, OkBtn }) => (
        <div className={styles.footer}>
          <Button disabled={overriddenCount === 0} onClick={() => setDraft({})}>
            全部還原
          </Button>
          <span className={styles.count}>{overriddenCount === 0 ? '沒有覆寫' : `已覆寫 ${overriddenCount} 項`}</span>
          <CancelBtn />
          <OkBtn />
        </div>
      )}
      okText="儲存"
      onCancel={onClose}
      onOk={() => {
        setStorage('galvo-dev-settings', draft);
        onClose();
      }}
      open
      // The body is long enough to run off a laptop screen, and a Modal grows to fit it, which
      // would push the footer past the bottom edge. Cap it and let the body scroll instead.
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: 8 } }}
      title="HEXA II 振鏡 — 開發者設定"
      width={720}
    >
      <div className={styles.intro}>
        這些值會直接送進 swiftray 的 fcode 匯出流程，而且只對 <code>fhx2galvo</code> 生效。
        留空的欄位完全不會送出，匯出端會用它自己的預設值——也就是每個欄位裡顯示的灰字。
      </div>
      {GALVO_DEV_SETTING_GROUPS.map((group) => (
        <div key={group.key}>
          <Divider orientation="left" plain>
            {group.title}
          </Divider>
          <div className={styles.groupNote}>{group.description}</div>
          {group.key === 'readOnly'
            ? readOnlyRows.map((row) => (
                <div className={classNames(styles.row, { [styles.disabled]: row.disabled })} key={row.label}>
                  <div className={styles.label}>
                    {row.label}
                    <Tooltip title={row.tooltip}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </div>
                  <div className={styles.readOnly}>{row.value}</div>
                </div>
              ))
            : GALVO_DEV_SETTING_FIELDS.filter((field) => field.group === group.key).map((field) => (
                <div className={styles.row} key={field.key}>
                  <div className={styles.label}>
                    {field.label}
                    {field.unit ? <span className={styles.unit}>({field.unit})</span> : null}
                    <Tooltip title={field.tooltip}>
                      <QuestionCircleOutlined className={styles.hint} />
                    </Tooltip>
                  </div>
                  <div className={styles.value}>
                    {renderControl(field)}
                    {draft[field.key] === undefined ? null : (
                      <Button onClick={() => clearValue(field.key)} size="small" type="link">
                        還原
                      </Button>
                    )}
                  </div>
                  <code className={styles.key}>{field.key}</code>
                </div>
              ))}
        </div>
      ))}
    </Modal>
  );
};

export default GalvoDevSettings;
