import { memo, useEffect, useMemo, useState } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import type { FitTextAlign } from '@core/app/svgedit/text/textedit';
import { getFitTextAlign, setFitTextAlign } from '@core/app/svgedit/text/textedit';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './FitTextAlignBlock.module.scss';

interface Props {
  textElements: SVGTextElement[];
}

const getValue = (textElements: SVGTextElement[]): FitTextAlign | null => {
  const firstAlign = getFitTextAlign(textElements[0]);

  for (let i = 1; i < textElements.length; i++) {
    if (getFitTextAlign(textElements[i]) !== firstAlign) {
      return null;
    }
  }

  return firstAlign;
};

const FitTextAlignBlock = ({ textElements }: Props): React.ReactNode => {
  const t = useI18n().beambox.right_panel.object_panel.option_panel;

  const alignOptions: Array<{ Icon: React.ComponentType; title: string; value: FitTextAlign }> = useMemo(
    () => [
      { Icon: OptionPanelIcons.AlignLeft, title: t.text_align_left, value: 'start' },
      { Icon: OptionPanelIcons.AlignCenter, title: t.text_align_center, value: 'middle' },
      { Icon: OptionPanelIcons.AlignRight, title: t.text_align_right, value: 'end' },
      { Icon: OptionPanelIcons.Justify, title: t.text_align_justify, value: 'justify' },
    ],
    [t],
  );
  const isMobile = useIsMobile();
  const [currentAlign, setCurrentAlign] = useState(getValue(textElements));
  const handleClick = (align: FitTextAlign) => {
    textElements.forEach((textElement) => {
      setFitTextAlign(textElement, align);
    });
    setCurrentAlign(align);
  };

  useEffect(() => {
    setCurrentAlign(getValue(textElements));
  }, [textElements]);

  return (
    <ConfigProvider theme={iconButtonTheme}>
      <div className={styles.container}>
        {alignOptions.map(({ Icon, title, value }) => (
          <Button
            className={classNames(styles.btn, { [styles.active]: currentAlign === value, [styles.mobile]: isMobile })}
            icon={<Icon />}
            key={value}
            onClick={() => handleClick(value)}
            title={title}
            type="text"
          />
        ))}
      </div>
    </ConfigProvider>
  );
};

export default memo(FitTextAlignBlock);
