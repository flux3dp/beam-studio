import { useEffect } from 'react';

import shortcuts from '@core/helpers/shortcuts';

const useNewShortcutsScope = (): void => {
  useEffect(() => shortcuts.enterScope(), []);
};

export default useNewShortcutsScope;
