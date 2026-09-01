import {
  type AddOnModeContext,
  type AddOnModeMutationOptions,
  resolveAddOnInfo,
  resolveDocumentValue,
  updateDocumentMode,
} from './types';

type PassThroughContext = AddOnModeContext & {
  values?: AddOnModeContext['values'] & { passThrough?: boolean };
};

export const checkPassThrough = (context: AddOnModeContext = {}): boolean =>
  Boolean(resolveAddOnInfo(context)?.passThrough);

/** Whether pass-through is supported and currently enabled. */
export const getPassThrough = (context: PassThroughContext = {}): boolean => {
  const addOnInfo = resolveAddOnInfo(context);

  if (!addOnInfo?.passThrough) return false;

  const enabled = context.values?.passThrough ?? resolveDocumentValue('pass-through', context);

  if (!enabled) return false;

  return addOnInfo.openBottom ? Boolean(resolveDocumentValue('borderless', context)) : true;
};

export const enablePassThrough = (options: AddOnModeMutationOptions = {}): void =>
  updateDocumentMode({ 'pass-through': true }, options);

export const disablePassThrough = (options: AddOnModeMutationOptions = {}): void =>
  updateDocumentMode({ 'pass-through': false }, options);
