import type { ReactNode } from 'react';
import React, { useCallback } from 'react';

import classNames from 'classnames';

import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import type { HoleOptionDef, HoleOptionValues, KeyChainCategory, TextOptionDef, TextOptionValues } from '../../types';
import useKeychainShapeStore from '../../useKeychainShapeStore';

import HoleGroup from './HoleGroup';
import styles from './OptionsPanel.module.scss';
import TextGroup from './TextGroup';

interface OptionsPanelProps {
  category: KeyChainCategory;
}

const resolveCategoryName = (t: ReturnType<typeof useI18n>['keychain_generator'], nameKey: string): string => {
  const parts = nameKey.split('.');

  if (parts.length === 2 && parts[0] === 'types') {
    return t.types?.[parts[1] as keyof typeof t.types] ?? nameKey;
  }

  return nameKey;
};

const OptionsPanel = ({ category }: OptionsPanelProps): ReactNode => {
  const { keychain_generator: t } = useI18n();
  const isMobile = useIsMobile();
  const holes = useKeychainShapeStore((s) => s.state.holes);
  const texts = useKeychainShapeStore((s) => s.state.texts);

  const handleHoleChange = useCallback((holeId: string, updates: Partial<HoleOptionValues>) => {
    const {
      state: { holes },
      updateState,
    } = useKeychainShapeStore.getState();

    updateState({ holes: { ...holes, [holeId]: { ...holes[holeId], ...updates } } });
  }, []);

  const handleTextChange = useCallback((textId: string, updates: Partial<TextOptionValues>) => {
    const {
      state: { texts },
      updateState,
    } = useKeychainShapeStore.getState();

    updateState({ texts: { ...texts, [textId]: { ...texts[textId], ...updates } } });
  }, []);

  return (
    <div className={classNames(styles.panel, { [styles.mobile]: isMobile })}>
      <div className={styles.header}>{resolveCategoryName(t, category.nameKey)}</div>
      <div className={styles.content}>
        {category.options.map((option) => {
          if (option.type === 'hole') {
            const holeDef = option as HoleOptionDef;

            return (
              <HoleGroup
                defaults={holeDef.defaults}
                hole={holes[holeDef.id]}
                id={holeDef.id}
                key={`hole-${holeDef.id}`}
                onHoleChange={handleHoleChange}
              />
            );
          }

          if (option.type === 'text') {
            const textDef = option as TextOptionDef;

            return (
              <TextGroup
                defaults={textDef.defaults}
                id={textDef.id}
                key={`text-${textDef.id}`}
                onTextChange={handleTextChange}
                text={texts[textDef.id]}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};

OptionsPanel.displayName = 'OptionsPanel';

export default OptionsPanel;
