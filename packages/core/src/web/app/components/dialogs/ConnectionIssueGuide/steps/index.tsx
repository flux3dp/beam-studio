import type { ReactNode } from 'react';
import React from 'react';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';

import StepConnectComputer from './StepConnectComputer';
import StepConnectWifi from './StepConnectWifi';
import StepHotspot from './StepHotspot';
import StepIpAddress from './StepIpAddress';
import StepStart from './StepStart';
import StepVerify from './StepVerify';

export interface ConnectionIssueStep {
  /** Rendered inside the SetupPageLayout content area. Layout is up to each step. */
  content: ReactNode;
}

export const getConnectionIssueSteps = (model: WorkAreaModel): ConnectionIssueStep[] => [
  { content: <StepStart /> },
  { content: <StepHotspot /> },
  { content: <StepConnectWifi model={model} /> },
  { content: <StepConnectComputer /> },
  { content: <StepIpAddress model={model} /> },
  { content: <StepVerify model={model} /> },
];
