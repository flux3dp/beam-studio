import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';

const useWorkarea = (): WorkAreaModel => {
  const workarea = useDocumentStore((state) => state.workarea);

  return workarea;
};

export default useWorkarea;
