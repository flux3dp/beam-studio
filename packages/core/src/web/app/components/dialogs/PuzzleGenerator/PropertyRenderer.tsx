import React, { useCallback } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { InputNumber, Select, Slider, Switch } from 'antd';
import { match, P } from 'ts-pattern';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import type {
  GroupPropertyDef,
  ImageUploadPropertyDef,
  NumberPropertyDef,
  PropertyDef,
  PuzzleState,
  SelectPropertyDef,
  TogglePropertyDef,
} from './types';

interface PropertyRendererProps {
  onNestedStateChange: <K extends 'border' | 'image'>(key: K, updates: Partial<PuzzleState[K]>) => void;
  onStateChange: (updates: Partial<PuzzleState>) => void;
  property: PropertyDef;
  state: PuzzleState;
}

/**
 * Generic property renderer that creates the appropriate control based on property type
 */
const PropertyRenderer = ({
  onNestedStateChange,
  onStateChange,
  property,
  state,
}: PropertyRendererProps): null | React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

  // Check visibility condition
  if (property.visible === false) {
    return null;
  }

  if (property.condition && !property.condition(state)) {
    return null;
  }

  // Helper to get nested value from state
  const getValue = (key: string): unknown => {
    const parts = key.split('.');

    if (parts.length === 2) {
      const [group, prop] = parts;
      const groupState = state[group as keyof PuzzleState];

      if (typeof groupState === 'object' && groupState !== null) {
        return (groupState as Record<string, unknown>)[prop];
      }

      return undefined;
    }

    return state[key as keyof PuzzleState];
  };

  // Helper to set value in state
  const setValue = (key: string, value: unknown): void => {
    const parts = key.split('.');

    if (parts.length === 2) {
      const [group, prop] = parts as ['border' | 'image', string];

      onNestedStateChange(group, { [prop]: value });
    } else {
      onStateChange({ [key]: value });
    }
  };

  // Get translated label
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
    .with({ type: 'image-upload' }, (property) => <ImageUploadProperty property={property} setValue={setValue} />)
    .exhaustive();
};

// ============================================================================
// Individual Property Components
// ============================================================================

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
  const value = (getValue(property.key) as number) ?? property.default;

  return (
    <div className={styles['property-row']}>
      <div className={styles['property-label']}>
        {getLabel(property.labelKey)}
        {property.unit && <span className={styles['property-unit']}>({property.unit})</span>}
      </div>
      <div className={styles['property-control']}>
        <Slider
          className={styles.slider}
          max={property.max}
          min={property.min}
          onChange={(val) => setValue(property.key, val)}
          step={property.step ?? 1}
          value={value}
        />
        <InputNumber
          className={styles['number-input']}
          max={property.max}
          min={property.min}
          onChange={(val) => val !== null && setValue(property.key, val)}
          step={property.step ?? 1}
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
  onStateChange: (updates: Partial<PuzzleState>) => void;
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

  // Find toggle child for the header
  const toggleChild = property.children.find((child) => child.type === 'toggle');

  // Get other children (non-toggle)
  const contentChildren = property.children.filter((child) => child.type !== 'toggle');

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
  property: ImageUploadPropertyDef;
  setValue: (key: string, value: unknown) => void;
}

const ImageUploadProperty = ({ property, setValue }: ImageUploadPropertyProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();

  // Get the image dataUrl from state (we need to access the parent group's state)
  // The key format is 'image.upload' but dataUrl is stored at 'image.dataUrl'
  const parentKey = property.key.split('.')[0];
  const dataUrlKey = `${parentKey}.dataUrl`;
  const fileKey = `${parentKey}.file`;

  // Note: We're using the setValue from props which handles nested state
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      // Validate file size
      if (file.size > property.maxSizeMB * 1024 * 1024) {
        // TODO: Show error alert
        console.error(`File size exceeds ${property.maxSizeMB}MB limit`);

        return;
      }

      // Read file and create data URL
      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        // Create image to check resolution
        const img = new Image();

        img.onload = () => {
          if (img.width > property.maxResolution || img.height > property.maxResolution) {
            // TODO: Show warning or auto-resize
            console.warn(`Image resolution exceeds ${property.maxResolution}px`);
          }

          // Set both file and dataUrl
          setValue(fileKey, file);
          setValue(dataUrlKey, dataUrl);
        };
        img.src = dataUrl;
      };

      reader.readAsDataURL(file);
    },
    [property.maxSizeMB, property.maxResolution, setValue, fileKey, dataUrlKey],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const file = event.dataTransfer.files?.[0];

      if (file && property.accept.includes(file.type)) {
        // Trigger same logic as file select
        const fakeEvent = {
          target: { files: [file] },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        handleFileSelect(fakeEvent);
      }
    },
    [property.accept, handleFileSelect],
  );

  // Note: For now, we'll show a placeholder. Getting the actual dataUrl requires
  // accessing the parent group state differently
  return (
    <div className={styles['image-upload']} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <input
        accept={property.accept}
        id="puzzle-image-upload"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        type="file"
      />
      <label htmlFor="puzzle-image-upload" style={{ cursor: 'pointer', display: 'block' }}>
        <UploadOutlined className={styles['upload-icon']} />
        <div className={styles['upload-text']}>{t.upload_image ?? 'Click or drag to upload'}</div>
        <div className={styles['upload-hint']}>{t.upload_hint ?? `JPG, PNG, WebP (max ${property.maxSizeMB}MB)`}</div>
      </label>
    </div>
  );
};

export default PropertyRenderer;
