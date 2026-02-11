import React from 'react';

import { match, P } from 'ts-pattern';

import useI18n from '@core/helpers/useI18n';

import type { NestedStateKey, PropertyDef, PuzzleState, PuzzleStateUpdate } from '../../types';

import GroupProperty from './GroupProperty';
import ImageUploadProperty from './ImageUploadProperty';
import SelectProperty from './SelectProperty';
import SliderProperty from './SliderProperty';
import ToggleProperty from './ToggleProperty';

export interface BasePropertyProps<T extends PropertyDef> {
  getLabel: (key: string) => string;
  getValue: (key: string) => unknown;
  property: T;
  setValue: (key: string, value: unknown) => void;
}

interface PropertyRendererProps {
  onNestedStateChange: <K extends NestedStateKey>(key: K, updates: Partial<PuzzleState[K]>) => void;
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
      const [group, prop] = parts as [NestedStateKey, string];
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
      const [group, prop] = parts as [NestedStateKey, string];

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
      <ImageUploadProperty getLabel={getLabel} getValue={getValue} property={property} setValue={setValue} />
    ))
    .exhaustive();
};

PropertyRenderer.displayName = 'PropertyRenderer';

export default PropertyRenderer;
