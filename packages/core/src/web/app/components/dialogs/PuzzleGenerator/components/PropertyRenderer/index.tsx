import React from 'react';

import { match, P } from 'ts-pattern';

import type { NestedStateKey, PropertyDef, PuzzleState, PuzzleStateUpdate } from '../../types';

import GroupProperty from './GroupProperty';
import ImageUploadProperty from './ImageUploadProperty';
import SelectProperty from './SelectProperty';
import SliderProperty from './SliderProperty';
import ToggleProperty from './ToggleProperty';

export interface BasePropertyProps<T extends PropertyDef> {
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
  if (property.visible === false || (property.condition && !property.condition(state))) {
    return null;
  }

  const getValue = (key: string): unknown => {
    if (key.includes('.')) {
      const [group, prop] = key.split('.');
      const groupState = state[group as NestedStateKey];

      return typeof groupState === 'object' && groupState !== null
        ? groupState[prop as keyof typeof groupState]
        : undefined;
    }

    return state[key as keyof typeof state];
  };

  const setValue = (key: string, value: unknown): void => {
    if (key.includes('.')) {
      const [group, prop] = key.split('.');

      onNestedStateChange(group as NestedStateKey, { [prop]: value });
    } else {
      onStateChange({ [key]: value } as PuzzleStateUpdate);
    }
  };

  return match(property)
    .with({ type: P.union('slider', 'number') }, (property) => (
      <SliderProperty getValue={getValue} property={property} setValue={setValue} />
    ))
    .with({ type: 'select' }, (property) => (
      <SelectProperty getValue={getValue} property={property} setValue={setValue} />
    ))
    .with({ type: 'toggle' }, (property) => (
      <ToggleProperty getValue={getValue} property={property} setValue={setValue} />
    ))
    .with({ type: 'group' }, (property) => (
      <GroupProperty
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

PropertyRenderer.displayName = 'PropertyRenderer';

export default PropertyRenderer;
