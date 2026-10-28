import {
  type AddOnModeContext,
  type AddOnModeMutationOptions,
  resolveAddOnInfo,
  resolveDocumentValue,
  updateDocumentMode,
} from './types';

type AutoFeederContext = AddOnModeContext & {
  values?: AddOnModeContext['values'] & { autoFeeder?: boolean };
};

export const checkAutoFeeder = (context: AddOnModeContext = {}): boolean =>
  Boolean(resolveAddOnInfo(context)?.autoFeeder);

/** Whether auto feeder is supported and currently enabled. */
export const getAutoFeeder = (context: AutoFeederContext = {}): boolean => {
  const addOnInfo = resolveAddOnInfo(context);

  if (!addOnInfo?.autoFeeder) return false;

  const enabled = context.values?.autoFeeder ?? resolveDocumentValue('auto-feeder', context);

  if (!enabled) return false;

  return addOnInfo.openBottom ? Boolean(resolveDocumentValue('borderless', context)) : true;
};

export const enableAutoFeeder = (options: AddOnModeMutationOptions = {}): void =>
  updateDocumentMode({ 'auto-feeder': true }, options);

export const disableAutoFeeder = (options: AddOnModeMutationOptions = {}): void =>
  updateDocumentMode({ 'auto-feeder': false }, options);
