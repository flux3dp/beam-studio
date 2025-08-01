import type { AddOnInfo } from '@core/app/constants/addOn';
import { getAddOnInfo } from '@core/app/constants/addOn';
import { useDocumentStore } from '@core/app/stores/documentStore';

/**
 * get if auto feeder is enabled according to beambox preference, add-on info and borderless setting
 * @param addOnInfo add-on info object for current workarea, if not provided, using beambox preference to get workarea
 * @param values provided values to avoid reading from beambox preference
 * @returns boolean
 */
export const getAutoFeeder = (
  addOnInfo?: AddOnInfo,
  values: { autoFeeder?: boolean; borderless?: boolean } = {},
): boolean => {
  const documentStore = useDocumentStore.getState();

  if (!addOnInfo) {
    addOnInfo = getAddOnInfo(documentStore.workarea);
  }

  if (!addOnInfo.autoFeeder) return false;

  const { autoFeeder, borderless } = values;

  if (!(autoFeeder ?? documentStore['auto-feeder'])) return false;

  return addOnInfo.openBottom ? (borderless ?? documentStore.borderless) : true;
};

/**
 * get if pass through is enabled according to beambox preference, add-on info and borderless setting
 * @param addOnInfo add-on info object for current workarea, if not provided, using beambox preference to get workarea
 * @param values provided values to avoid reading from beambox preference
 * @returns boolean
 */
export const getPassThrough = (
  addOnInfo?: AddOnInfo,
  values: { borderless?: boolean; passThrough?: boolean } = {},
): boolean => {
  const documentStore = useDocumentStore.getState();

  if (!addOnInfo) {
    addOnInfo = getAddOnInfo(documentStore.workarea);
  }

  if (!addOnInfo.passThrough) return false;

  const { borderless, passThrough } = values;

  if (!(passThrough ?? documentStore['pass-through'])) return false;

  return addOnInfo.openBottom ? (borderless ?? documentStore.borderless) : true;
};
