import { createContext } from 'react';

import type { SetupPageButtonConfig } from '@core/app/pages/InitializeMachine/Components/SetupPageLayout';

export type ConnectionIssueResult = 'fail' | 'success';

interface ConnectionIssueGuideContextValue {
  /** Override the container's primary (next) button for the active step. Pass null to use the default. */
  setPrimaryButton: (button: null | SetupPageButtonConfig) => void;
  /** Show a terminal result screen (success/fail), or null to return to the step flow. */
  setResult: (result: ConnectionIssueResult | null) => void;
}

export const ConnectionIssueGuideContext = createContext<ConnectionIssueGuideContextValue>({
  setPrimaryButton: () => {},
  setResult: () => {},
});
