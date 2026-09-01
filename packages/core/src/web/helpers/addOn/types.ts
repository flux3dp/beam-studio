import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import type { DocumentState } from '@core/interfaces/Preference';
import type { PromarkInfo } from '@core/interfaces/Promark';

export interface AddOnModeContext {
  addOnInfo?: AddOnInfo | null;
  promarkInfo?: null | PromarkInfo;
  values?: Partial<DocumentState>;
  workarea?: WorkAreaModel;
}

export interface AddOnModeMutationOptions {
  /** False when only building a draft/document patch. */
  applyRuntime?: boolean;
  promarkInfo?: PromarkInfo;
  update?: (values: Partial<DocumentState>) => void;
}

export const resolveWorkarea = ({ values, workarea }: AddOnModeContext = {}): WorkAreaModel =>
  workarea ?? values?.workarea ?? useDocumentStore.getState().workarea;

export const resolveAddOnInfo = ({ addOnInfo, ...context }: AddOnModeContext = {}): AddOnInfo | null => {
  if (addOnInfo !== undefined) return addOnInfo;

  return getAddOnInfo(resolveWorkarea(context));
};

export const resolveDocumentValue = <Key extends keyof DocumentState>(
  key: Key,
  { values }: AddOnModeContext = {},
): DocumentState[Key] => {
  const value = values?.[key];

  return value === undefined ? useDocumentStore.getState()[key] : (value as DocumentState[Key]);
};

export const updateDocumentMode = (
  values: Partial<DocumentState>,
  { update = useDocumentStore.getState().update }: AddOnModeMutationOptions = {},
): void => update(values);
