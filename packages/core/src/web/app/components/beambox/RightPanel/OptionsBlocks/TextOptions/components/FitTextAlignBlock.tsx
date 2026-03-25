import { memo, useEffect, useState } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import type { FitTextAlign } from '@core/app/svgedit/text/textedit';
import { getFitTextAlign, setFitTextAlign } from '@core/app/svgedit/text/textedit';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './FitTextAlignBlock.module.scss';

const alignOptions: Array<{ Icon: React.ComponentType; value: FitTextAlign }> = [
  { Icon: OptionPanelIcons.AlignLeft, value: 'start' },
  { Icon: OptionPanelIcons.AlignCenter, value: 'middle' },
  { Icon: OptionPanelIcons.AlignRight, value: 'end' },
  { Icon: OptionPanelIcons.Justify, value: 'justify' },
];

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
  const isMobile = useIsMobile();
  const [currentAlign, setCurrentAlign] = useState(getValue(textElements));
  const handleClick = (align: FitTextAlign) => {
    for (const textElement of textElements) {
      if (getFitTextAlign(textElement) !== align) {
        setFitTextAlign(textElement, align);
      }
    }
    setCurrentAlign(align);
  };

  useEffect(() => {
    setCurrentAlign(getValue(textElements));
  }, [textElements]);

  return (
    <ConfigProvider theme={iconButtonTheme}>
      <div className={styles.container}>
        {alignOptions.map(({ Icon, value }) => (
          <Button
            className={classNames(styles.btn, { [styles.active]: currentAlign === value, [styles.mobile]: isMobile })}
            icon={<Icon />}
            key={value}
            onClick={() => handleClick(value)}
            type="text"
          />
        ))}
      </div>
    </ConfigProvider>
  );
};

export default memo(FitTextAlignBlock);
