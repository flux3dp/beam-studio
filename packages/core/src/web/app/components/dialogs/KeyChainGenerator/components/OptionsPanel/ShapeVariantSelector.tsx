import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import useI18n from '@core/helpers/useI18n';

import type { ShapeVariant } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import GroupCollapse from './Controls/GroupCollapse';
import IconSelectorGrid from './Controls/IconSelectorGrid';
import type { IconSelectorItem } from './Controls/IconSelectorGrid';

interface ShapeVariantSelectorProps {
  variants: ShapeVariant[];
}

const ShapeVariantSelector = ({ variants }: ShapeVariantSelectorProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const variantKey = useKeychainShapeStore((s) => s.state.variantKey);
  const setVariant = useKeychainShapeStore((s) => s.setVariant);

  const items: IconSelectorItem[] = useMemo(
    () =>
      variants.map((variant) => ({
        innerHTML: variant.svgContent,
        key: variant.key,
      })),
    [variants],
  );

  return (
    <GroupCollapse collapsible={false} title={t.shape}>
      <IconSelectorGrid items={items} onSelect={setVariant} selectedKey={variantKey} strokeIcon />
    </GroupCollapse>
  );
};

ShapeVariantSelector.displayName = 'ShapeVariantSelector';

export default ShapeVariantSelector;
