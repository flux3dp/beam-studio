import type { ConfigItem } from '@core/interfaces/ILayerConfig';

export const updateConfigs = <T extends Record<string, any>, K extends keyof T>(
  configs: { [key in keyof T]: ConfigItem<T[key]> },
  key: K,
  getValue: () => T[K],
) => {
  if (!configs[key]?.hasMultiValue) {
    const value = getValue();

    if (configs[key] === undefined) {
      configs[key] = { hasMultiValue: false, value };
    } else if (configs[key].value !== value) {
      configs[key].hasMultiValue = true;
    }
  }
};
