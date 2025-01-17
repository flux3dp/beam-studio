import { useEffect } from 'react';

import shortcuts from 'helpers/shortcuts';

const useNewShortcutsScope = (): void => {
  useEffect(() => shortcuts.enterScope(), []);
};

export default useNewShortcutsScope;
