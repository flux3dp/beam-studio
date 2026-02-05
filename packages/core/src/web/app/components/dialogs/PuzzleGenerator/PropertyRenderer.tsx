import React, { useCallback } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Select, Slider, Switch } from 'antd';
import { match, P } from 'ts-pattern';

import alertCaller from '@core/app/actions/alert-caller';
import { useStorageStore } from '@core/app/stores/storageStore';
import UnitInput from '@core/app/widgets/UnitInput';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import type {
  GroupPropertyDef,
  ImageUploadPropertyDef,
  NumberPropertyDef,
  PropertyDef,
  PuzzleState,
  PuzzleStateUpdate,
  SelectPropertyDef,
  TogglePropertyDef,
} from './types';

interface PropertyRendererProps {
  onNestedStateChange: <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) => void;
  onStateChange: (updates: PuzzleStateUpdate) => void;
  property: PropertyDef;
  state: PuzzleState;
}

const PropertyRenderer = ({
  onNestedStateChange,
  onStateChange,
  property,
  state,
}: PropertyRendererProps): null | React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

  if (property.visible === false || (property.condition && !property.condition(state))) {
    return null;
  }

  const getShapeValue = (key: string): unknown => {
    if (key === 'radius' && state.typeId === 'rectangle') return state.radius;

    return undefined;
  };

  const getValue = (key: string): unknown => {
    const parts = key.split('.');

    if (parts.length === 2) {
      const [group, prop] = parts as ['border' | 'image', string];
      const groupState = state[group];

      if (typeof groupState === 'object' && groupState !== null) {
        return groupState[prop as keyof typeof groupState];
      }

      return undefined;
    }

    // Try shared fields first, then shape-specific fields
    if (key in state) return state[key as keyof typeof state];

    return getShapeValue(key);
  };

  const setValue = (key: string, value: unknown): void => {
    const parts = key.split('.');

    if (parts.length === 2) {
      const [group, prop] = parts as ['border' | 'image', string];

      onNestedStateChange(group, { [prop]: value });
    } else {
      onStateChange({ [key]: value } as PuzzleStateUpdate);
    }
  };

  const getLabel = (labelKey: string): string => {
    const translated = t[labelKey as keyof typeof t];

    return typeof translated === 'string' ? translated : labelKey;
  };

  return match(property)
    .with({ type: P.union('slider', 'number') }, (property) => (
      <SliderProperty getLabel={getLabel} getValue={getValue} property={property} setValue={setValue} />
    ))
    .with({ type: 'select' }, (property) => (
      <SelectProperty getLabel={getLabel} getValue={getValue} property={property} setValue={setValue} />
    ))
    .with({ type: 'toggle' }, (property) => (
      <ToggleProperty getLabel={getLabel} getValue={getValue} property={property} setValue={setValue} />
    ))
    .with({ type: 'group' }, (property) => (
      <GroupProperty
        getLabel={getLabel}
        getValue={getValue}
        onNestedStateChange={onNestedStateChange}
        onStateChange={onStateChange}
        property={property}
        setValue={setValue}
        state={state}
      />
    ))
    .with({ type: 'image-upload' }, (property) => (
      <ImageUploadProperty getValue={getValue} property={property} setValue={setValue} />
    ))
    .exhaustive();
};

interface BasePropertyProps<T extends PropertyDef> {
  getLabel: (key: string) => string;
  getValue: (key: string) => unknown;
  property: T;
  setValue: (key: string, value: unknown) => void;
}

const SliderProperty = ({
  getLabel,
  getValue,
  property,
  setValue,
}: BasePropertyProps<NumberPropertyDef>): React.JSX.Element => {
  const isInch = useStorageStore((s) => s.isInch);
  const value = (getValue(property.key) as number) ?? property.default;

  const isMmProperty = property.unit === 'mm';
  const step = property.step ?? 1;
  const inchStep = isMmProperty && isInch ? 0.254 : step;
  const precision = isMmProperty && isInch ? 4 : Math.max(0, Math.ceil(-Math.log10(step)));
  const displayUnit = isMmProperty ? (isInch ? 'in' : 'mm') : property.unit;

  return (
    <div className={styles['property-row']}>
      <div className={styles['property-label']}>{getLabel(property.labelKey)}</div>
      <div className={styles['property-control']}>
        <Slider
          className={styles.slider}
          max={property.max}
          min={property.min}
          onChange={(val) => setValue(property.key, val)}
          step={step}
          tooltip={{ open: false }}
          value={value}
        />
        <UnitInput
          className={styles['number-input']}
          controls={false}
          isInch={isMmProperty ? isInch : undefined}
          max={property.max}
          min={property.min}
          onChange={(val) => val !== undefined && setValue(property.key, val)}
          precision={precision}
          step={inchStep}
          unit={displayUnit}
          value={value}
        />
      </div>
    </div>
  );
};

const SelectProperty = ({
  getLabel,
  getValue,
  property,
  setValue,
}: BasePropertyProps<SelectPropertyDef>): React.JSX.Element => {
  const value = (getValue(property.key) as number | string) ?? property.default;

  const options = property.options.map((opt) => ({
    label: getLabel(opt.labelKey),
    value: opt.value,
  }));

  return (
    <div className={styles['property-row']}>
      <div className={styles['property-label']}>{getLabel(property.labelKey)}</div>
      <Select
        onChange={(val) => setValue(property.key, val)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        popupMatchSelectWidth={false}
        style={{ width: '100%' }}
        value={value}
      />
    </div>
  );
};

const ToggleProperty = ({
  getLabel,
  getValue,
  property,
  setValue,
}: BasePropertyProps<TogglePropertyDef>): React.JSX.Element => {
  const value = (getValue(property.key) as boolean) ?? property.default;

  return (
    <div className={styles['property-row']} style={{ alignItems: 'center', flexDirection: 'row' }}>
      <div className={styles['property-label']} style={{ flex: 1 }}>
        {getLabel(property.labelKey)}
      </div>
      <Switch checked={value} onChange={(checked) => setValue(property.key, checked)} />
    </div>
  );
};

interface GroupPropertyProps extends BasePropertyProps<GroupPropertyDef> {
  onNestedStateChange: <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) => void;
  onStateChange: (updates: PuzzleStateUpdate) => void;
  state: PuzzleState;
}

const GroupProperty = ({
  getLabel,
  getValue,
  onNestedStateChange,
  onStateChange,
  property,
  state,
}: GroupPropertyProps): React.JSX.Element => {
  // Find the toggle property if enabledBy is set
  const isEnabled = property.enabledBy ? (getValue(property.enabledBy) as boolean) : true;

  // Find the header toggle (the one that controls the group's enabled state)
  const toggleChild = property.enabledBy
    ? property.children.find((child) => child.key === property.enabledBy)
    : undefined;

  // Get other children (exclude only the header toggle)
  const contentChildren = property.children.filter((child) => child !== toggleChild);

  if (property.expandable) {
    return (
      <div className={styles['property-group']}>
        <div className={styles['group-header']}>
          <span className={styles['group-title']}>{getLabel(property.labelKey)}</span>
          {toggleChild && (
            <Switch
              checked={getValue(toggleChild.key) as boolean}
              onChange={(checked) => {
                const parts = toggleChild.key.split('.');

                if (parts.length === 2) {
                  const [group, prop] = parts as ['border' | 'image', string];

                  onNestedStateChange(group, { [prop]: checked });
                }
              }}
            />
          )}
        </div>
        {isEnabled && contentChildren.length > 0 && (
          <div className={styles['group-content']}>
            {contentChildren.map((child) => (
              <PropertyRenderer
                key={child.key}
                onNestedStateChange={onNestedStateChange}
                onStateChange={onStateChange}
                property={child}
                state={state}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Non-expandable group - just render children inline
  return (
    <>
      {property.children.map((child) => (
        <PropertyRenderer
          key={child.key}
          onNestedStateChange={onNestedStateChange}
          onStateChange={onStateChange}
          property={child}
          state={state}
        />
      ))}
    </>
  );
};

interface ImageUploadPropertyProps {
  getValue: (key: string) => unknown;
  property: ImageUploadPropertyDef;
  setValue: (key: string, value: unknown) => void;
}

const ImageUploadProperty = ({ getValue, property, setValue }: ImageUploadPropertyProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const parentKey = property.key.split('.')[0];
  const dataUrlKey = `${parentKey}.dataUrl`;
  const fileKey = `${parentKey}.file`;
  const currentDataUrl = getValue(dataUrlKey) as null | string;
  const acceptedTypes = property.accept.split(',');

  const processFile = useCallback(
    (file: File) => {
      if (file.size > property.maxSizeMB * 1024 * 1024) {
        alertCaller.popUpError({
          message: t.file_too_large,
        });

        return;
      }

      if (!acceptedTypes.includes(file.type)) {
        alertCaller.popUpError({
          message: t.unsupported_file_type,
        });

        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();

        img.onload = () => {
          if (img.width > property.maxResolution || img.height > property.maxResolution) {
            console.warn(`Image resolution exceeds ${property.maxResolution}px`);
          }

          setValue(fileKey, file);
          setValue(dataUrlKey, dataUrl);
        };
        img.onerror = () => {
          console.error('Failed to load image for validation:', file.name);
          alertCaller.popUpError({ message: t.image_load_failed });
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        console.error('FileReader failed to read file:', file.name, reader.error);
        alertCaller.popUpError({ message: t.image_load_failed });
      };

      reader.readAsDataURL(file);
    },
    [property.maxSizeMB, property.maxResolution, acceptedTypes, setValue, fileKey, dataUrlKey, t],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const file = event.dataTransfer.files?.[0];

      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div
      className={`${styles['image-upload']} ${currentDataUrl ? styles['has-image'] : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        accept={property.accept}
        id="puzzle-image-upload"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        type="file"
      />
      <label htmlFor="puzzle-image-upload" style={{ cursor: 'pointer', display: 'block' }}>
        {currentDataUrl ? (
          <>
            <img alt="" className={styles['image-preview']} src={currentDataUrl} />
            <div className={styles['upload-text']}>{t.change_image}</div>
          </>
        ) : (
          <>
            <UploadOutlined className={styles['upload-icon']} />
            <div className={styles['upload-text']}>{t.upload_image}</div>
            <div className={styles['upload-hint']}>{t.upload_hint}</div>
          </>
        )}
      </label>
    </div>
  );
};

export default PropertyRenderer;
