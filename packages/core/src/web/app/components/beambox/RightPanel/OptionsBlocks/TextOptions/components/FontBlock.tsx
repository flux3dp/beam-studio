import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import dialogCaller from '@core/app/actions/dialog-caller';
import ControlBlock from '@core/app/components/beambox/RightPanel/common/ControlBlock';
import Row from '@core/app/components/beambox/RightPanel/common/Row';
import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import { useIsTabletOrMobile } from '@core/app/stores/layoutStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import textEdit from '@core/app/svgedit/text/textedit';
import Select from '@core/app/widgets/AntdSelect';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import { ControlType } from '@core/helpers/element/editable/base';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import fontHelper from '@core/helpers/fonts/fontHelper';
import { createGoogleFontObject, getWeightAndStyleFromVariant } from '@core/helpers/fonts/fontUtils';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
import type { FontOption } from '@core/helpers/fonts/renderTextOptions';
import { fontFamilySelectFilterOption, renderTextOptions } from '@core/helpers/fonts/renderTextOptions';
import { resolveFontByStyle } from '@core/helpers/fonts/resolveFontByStyle';
import { useFontStyleOptions } from '@core/helpers/fonts/useFontStyleOptions';
import useI18n from '@core/helpers/useI18n';
import type { GeneralFont } from '@core/interfaces/IFont';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';

import styles from './FontBlock.module.scss';

const eventEmitter = eventEmitterFactory.createEventEmitter('font');

const isLocalFont = (font: GeneralFont) => 'path' in font;

interface FontBlockProps {
  fontFamily: ConfigItem<string>;
  fontStyle: ConfigItem<string>;
  onConfigChange: (key: 'fontFamily' | 'fontStyle', value: string) => void;
  textElements: SVGTextElement[];
  waitForWebFont: (fontLoadedPromise?: Promise<void>) => Promise<void>;
}

const FontBlock = ({
  fontFamily,
  fontStyle,
  onConfigChange,
  textElements,
  waitForWebFont,
}: FontBlockProps): React.ReactNode => {
  const lang = useI18n();
  const langOptionPanel = lang.beambox.right_panel.object_panel.option_panel;
  const isTablet = useIsTabletOrMobile();
  const fontHistory = useStorageStore((state) => state['font-history']);
  const [fontFamilies, setFontFamilies] = useState<string[]>(FontFuncs.requestAvailableFontFamilies());

  const addToHistory = useGoogleFontStore((s) => s.addToHistory);
  const binaryLoader = useGoogleFontStore((s) => s.loadGoogleFontBinary);
  const registerGoogleFont = useGoogleFontStore((s) => s.registerGoogleFont);

  const styleOptions = useFontStyleOptions(fontFamily.hasMultiValue ? '' : fontFamily.value);

  useEffect(() => {
    const handler = () => setFontFamilies(FontFuncs.requestAvailableFontFamilies());

    eventEmitter.on('GET_MONOTYPE_FONTS', handler);

    return () => {
      eventEmitter.removeListener('GET_MONOTYPE_FONTS', handler);
    };
  }, []);

  useEffect(() => {
    if (fontHistory?.length > 0) {
      const store = useGoogleFontStore.getState();

      fontHistory.forEach((family) => {
        if (!store.isGoogleFontLoaded(family)) {
          store.loadGoogleFont(family);
        }
      });
    }
  }, [fontHistory]);

  const historyFontFamilies = useMemo(() => {
    const allFontFamilies = new Set(fontFamilies.map((f) => f.toLowerCase()));

    return fontHistory
      .map((family) => {
        return renderTextOptions(family, allFontFamilies.has(family.toLowerCase()));
      })
      .filter(Boolean);
  }, [fontHistory, fontFamilies]);

  const applyFontToElements = useCallback(
    async ({
      font,
      fontFamily: familyName,
      fontLoadedPromise,
    }: {
      font: GeneralFont;
      fontFamily: string;
      fontLoadedPromise?: Promise<void>;
    }): Promise<void> => {
      const batchCmd = new history.BatchCommand('Change Font family');

      [
        textEdit.setFontPostscriptName(font.postscriptName, true, textElements),
        textEdit.setItalic(font.italic, true, textElements),
        textEdit.setFontWeight(font.weight, true, textElements),
        textEdit.setFontFamily(familyName, true, textElements),
      ].forEach((cmd) => {
        if (cmd) batchCmd.addSubCommand(cmd);
      });

      undoManager.addCommandToHistory(batchCmd);

      if (!isLocalFont(font)) {
        await waitForWebFont(fontLoadedPromise);
      }

      onConfigChange('fontFamily', familyName);
      onConfigChange('fontStyle', font.style);
    },
    [textElements, onConfigChange, waitForWebFont],
  );

  const handleGoogleFontSelect = useCallback(
    async (selectedFontFamily: string) => {
      const localFontMatch = FontFuncs.findFontFamilyCaseInsensitive(selectedFontFamily);

      if (localFontMatch) {
        const fonts = FontFuncs.requestFontsOfTheFontFamily(localFontMatch);

        if (!fonts || fonts.length === 0) {
          console.error(`No fonts found for family: ${localFontMatch}`);

          return;
        }

        const localFont = fonts[0];

        addToHistory(localFont);

        const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(localFont, getCurrentUser());

        if (!success) {
          return;
        }

        await applyFontToElements({
          font: localFont,
          fontFamily: localFontMatch,
          fontLoadedPromise,
        });
      } else {
        await useGoogleFontStore.getState().loadGoogleFontForTextEditing(selectedFontFamily);

        const fontData = await googleFontsApiCache.findFont(selectedFontFamily);

        if (fontData && fontData.variants && fontData.variants.length > 0) {
          const { style, weight } = getWeightAndStyleFromVariant(fontData.variants[0]);
          const googleFont = createGoogleFontObject({ binaryLoader, fontFamily: selectedFontFamily, style, weight });

          addToHistory(googleFont);
          registerGoogleFont(selectedFontFamily);

          await applyFontToElements({
            font: googleFont,
            fontFamily: selectedFontFamily,
          });
        } else {
          const googleFont = createGoogleFontObject({
            binaryLoader,
            fontFamily: selectedFontFamily,
            style: 'Regular',
            weight: 400,
          });

          addToHistory(googleFont);
          registerGoogleFont(selectedFontFamily);

          await applyFontToElements({
            font: googleFont,
            fontFamily: selectedFontFamily,
          });
        }
      }
    },
    [addToHistory, applyFontToElements, binaryLoader, registerGoogleFont],
  );

  const handleFontFamilyChange = useCallback(
    async (newFamily: string, option: FontOption) => {
      if (newFamily === 'more-google-fonts') {
        dialogCaller.showGoogleFontsPanel(handleGoogleFontSelect);

        return;
      }

      const family = option.family ?? newFamily;
      const localFontMatch = FontFuncs.findFontFamilyCaseInsensitive(family);

      if (!localFontMatch) {
        await handleGoogleFontSelect(family);

        return;
      }

      const fonts = FontFuncs.requestFontsOfTheFontFamily(localFontMatch);

      if (!fonts || fonts.length === 0) {
        console.error(`No fonts found for family: ${localFontMatch}`);
        await handleGoogleFontSelect(family);

        return;
      }

      const newFont = fonts[0];

      addToHistory(newFont);

      const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(newFont, getCurrentUser());

      if (!success) {
        return;
      }

      await applyFontToElements({
        font: newFont,
        fontFamily: localFontMatch,
        fontLoadedPromise,
      });
    },
    [addToHistory, applyFontToElements, handleGoogleFontSelect],
  );

  const handleFontStyleChange = useCallback(
    async (val: string) => {
      const font = await resolveFontByStyle(fontFamily.value, val);

      if (!font) return;

      const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(font, getCurrentUser());

      if (!success) return;

      const batchCmd = new history.BatchCommand('Change Font Style');

      [
        textEdit.setFontPostscriptName(font.postscriptName, true, textElements),
        textEdit.setItalic(font.italic, true, textElements),
        textEdit.setFontWeight(font.weight, true, textElements),
      ].forEach((cmd) => {
        if (cmd) batchCmd.addSubCommand(cmd);
      });
      undoManager.addCommandToHistory(batchCmd);

      if (!isLocalFont(font)) {
        await waitForWebFont(fontLoadedPromise);
      }

      onConfigChange('fontStyle', val);
    },
    [fontFamily.value, textElements, waitForWebFont, onConfigChange],
  );

  const options: FontOption[] = fontFamilies.map((family) => renderTextOptions(family));
  const isOnlyOneOption = options.length === 1;

  const familySelect = (
    <Select
      className={styles['font-family']}
      disabled={isOnlyOneOption}
      dropdownRender={(menu) => (
        <>
          {menu}
          <div className={styles['google-fonts-separator']}>
            <div
              className={styles['google-fonts-button']}
              onClick={() => dialogCaller.showGoogleFontsPanel(handleGoogleFontSelect)}
            >
              {lang.google_font_panel.more_google_fonts}
            </div>
          </div>
        </>
      )}
      filterOption={fontFamilySelectFilterOption}
      onChange={(value, option) => handleFontFamilyChange(value, option as FontOption)}
      onKeyDown={(e) => e.stopPropagation()}
      options={[
        { label: langOptionPanel.recently_used, options: historyFontFamilies, title: 'history' },
        { label: null, options, title: 'normal' },
      ]}
      placement="bottomRight"
      popupClassName={styles['font-family-dropdown']}
      popupMatchSelectWidth={false}
      showSearch
      title={langOptionPanel.font_family}
      value={fontFamily.hasMultiValue ? '-' : fontFamily.value}
    />
  );

  const disabled = styleOptions.length <= 1;

  const styleSelect = (
    <Select
      className={styles['font-style']}
      disabled={disabled}
      onChange={(value) => handleFontStyleChange(value)}
      onKeyDown={(e) => e.stopPropagation()}
      options={styleOptions}
      popupMatchSelectWidth={false}
      title={langOptionPanel.font_style}
      value={fontFamily.hasMultiValue || fontStyle.hasMultiValue ? '-' : fontStyle.value}
    />
  );

  return isTablet ? (
    <Row>
      <ControlBlock
        className={styles['font-family']}
        label={langOptionPanel.font_family}
        type={ControlType.FONT_FAMILY}
      >
        {familySelect}
      </ControlBlock>
      <ControlBlock className={styles['font-style']} label={langOptionPanel.font_style} type={ControlType.FONT_STYLE}>
        {styleSelect}
      </ControlBlock>
    </Row>
  ) : (
    <>
      <ControlBlock className={styles['labeled-row']} type={ControlType.FONT_FAMILY}>
        <span className={styles['prefix-label']}>Aa</span>
        {familySelect}
      </ControlBlock>
      <ControlBlock className={styles['labeled-row']} type={ControlType.FONT_STYLE}>
        <span className={classNames(styles['prefix-label'], styles.bold)}>B</span>
        {styleSelect}
      </ControlBlock>
    </>
  );
};

export default memo(FontBlock);
