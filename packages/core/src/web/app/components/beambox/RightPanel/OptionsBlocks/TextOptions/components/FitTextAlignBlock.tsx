import { memo, useEffect, useMemo, useState } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';

import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import FlexButton from '@core/app/components/beambox/RightPanel/common/FlexButton';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import { iconButtonTheme } from '@core/app/constants/antd-config';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import type { FitTextAlign } from '@core/app/svgedit/text/textedit';
import { getFitTextAlign, setFitTextAlign } from '@core/app/svgedit/text/textedit';
import { ControlType } from '@core/helpers/element/editable/base';
import useI18n from '@core/helpers/useI18n';

import styles from './AlignBlock.module.scss';

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
  const isTablet = useIsTabletOrMobile();
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

  return isTablet ? (
    <ControlBlock label={t.text_align} type={ControlType.FIT_TEXT_ALIGN}>
      <Row>
        {alignOptions.map(({ Icon, title, value }) => (
          <FlexButton
            active={currentAlign === value}
            icon={<Icon />}
            key={value}
            onClick={() => handleClick(value)}
            title={title}
          />
        ))}
      </Row>
    </ControlBlock>
  ) : (
    <ConfigProvider theme={iconButtonTheme}>
      <ControlBlock className={styles.container} type={ControlType.FIT_TEXT_ALIGN}>
        {alignOptions.map(({ Icon, title, value }) => (
          <Button
            className={classNames(styles.btn, { [styles.active]: currentAlign === value })}
            icon={<Icon />}
            key={value}
            onClick={() => handleClick(value)}
            title={title}
            type="text"
          />
        ))}
      </ControlBlock>
    </ConfigProvider>
  );
};

export default memo(FitTextAlignBlock);
