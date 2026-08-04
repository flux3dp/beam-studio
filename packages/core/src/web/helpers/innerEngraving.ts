import { supportInnerEngraving } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';

/**
 * Whether inner engraving mode is currently active.
 *
 * The document store only holds the user's toggle: it cannot combine it with the model capability
 * itself, because `workarea-constants` already imports the store. Callers use these helpers instead
 * of reading `inner-engraving` directly, so a document saved on a Promark UV does not put another
 * machine into inner engraving mode.
 */
export const isInnerEngravingActive = (): boolean => {
  const { 'inner-engraving': enabled, workarea } = useDocumentStore.getState();

  return enabled && supportInnerEngraving(workarea);
};

/** Hook form of {@link isInnerEngravingActive}. */
export const useInnerEngravingActive = (): boolean =>
  useDocumentStore((state) => state['inner-engraving'] && supportInnerEngraving(state.workarea));
