import { useCallback, useEffect, useRef } from 'react';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import { setStorage, useStorageStore } from '@core/app/stores/storageStore';
import type { Selector } from '@core/app/svgedit/selector';
import selector from '@core/app/svgedit/selector';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { TextOption } from '@core/interfaces/ObjectPanel';

import { useTextOptionsStore } from '../stores/useTextOptionsStore';
import { createFontStyleOptions } from '../utils/fontUtils';
import { extractTextElementsConfig, shouldUpdateElementConfig } from '../utils/textConfigUtils';

const eventEmitter = eventEmitterFactory.createEventEmitter('font');

interface UseTextConfigurationParams {
  elem: Element;
  textElements: SVGTextElement[];
  updateObjectPanel: () => void;
}

export const useTextConfiguration = ({ elem, textElements, updateObjectPanel }: UseTextConfigurationParams) => {
  const selectorRef = useRef<null | Selector>(null);
  const fontHistory = useStorageStore((state) => state['font-history']);

  const {
    addToFontHistory,
    availableFontFamilies,
    configs,
    setAvailableFontFamilies,
    setConfigs,
    setCurrentElementId,
    setFontHistory,
    setStyleOptions,
    updateConfig,
  } = useTextOptionsStore();

  const { fontFamily } = configs;

  // Initialize selector
  useEffect(() => {
    selectorRef.current = selector.getSelectorManager().requestSelector(elem);

    return () => {
      selector.getSelectorManager().releaseSelector(elem);
      selectorRef.current = null;
    };
  }, [elem]);

  // Set font history from storage
  useEffect(() => {
    setFontHistory(fontHistory || []);
  }, [fontHistory, setFontHistory]);

  const onConfigChange = useCallback(
    <T extends keyof any>(key: T, value: any) => {
      updateConfig(key as keyof TextOption, value);
      selectorRef.current?.resize();
      updateObjectPanel();
    },
    [updateConfig, updateObjectPanel],
  );

  const getFontFamilies = useCallback(async () => {
    const families = FontFuncs.requestAvailableFontFamilies();

    setAvailableFontFamilies(families);
  }, [setAvailableFontFamilies]);

  const addToHistory = useCallback(
    (family: string) => {
      addToFontHistory(family);
      setStorage('font-history', [...(fontHistory || []).filter((f) => f !== family), family].slice(-5));
    },
    [addToFontHistory, fontHistory],
  );

  // Listen for font events
  useEffect(() => {
    eventEmitter.on('GET_MONOTYPE_FONTS', getFontFamilies);

    return () => {
      eventEmitter.removeListener('GET_MONOTYPE_FONTS', getFontFamilies);
    };
  }, [getFontFamilies]);

  // Update configuration when element changes
  useEffect(() => {
    const getStateFromElem = () => {
      const elemId = elem.getAttribute('id')!;

      if (!shouldUpdateElementConfig(elemId, configs.id.value)) {
        return;
      }

      const newConfigs = extractTextElementsConfig(textElements, availableFontFamilies, elemId);

      setConfigs(newConfigs);
      setCurrentElementId(elemId);
      selectorRef.current?.resize();
    };

    if (availableFontFamilies.length > 0) {
      getStateFromElem();
    } else {
      getFontFamilies();
    }
  }, [elem, textElements, availableFontFamilies, configs.id.value, getFontFamilies, setConfigs, setCurrentElementId]);

  // Update style options when font family changes
  useEffect(() => {
    const getStyleOptions = (family: string) => {
      const options = createFontStyleOptions(family);

      setStyleOptions(options);
    };

    if (fontFamily.hasMultiValue) {
      setStyleOptions([]);
    } else {
      getStyleOptions(fontFamily.value);
    }
  }, [fontFamily, setStyleOptions]);

  return {
    addToHistory,
    onConfigChange,
  };
};
