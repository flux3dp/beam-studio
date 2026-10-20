import React from 'react';

import { Tooltip } from 'antd';
import { sprintf } from 'sprintf-js';

import type { LensParameterIssue } from '@core/helpers/device/promark/validate-lens-parameters';
import useI18n from '@core/helpers/useI18n';

import { formatLensParameterRange } from './lensParameterLabels';

interface RangeTooltipProps {
  children: React.ReactElement;
  isInch?: boolean;
  issue?: LensParameterIssue;
}

/** Explains the range a parameter input broke. Always rendered, so the input keeps focus while typing. */
const RangeTooltip = ({ children, isInch = false, issue }: RangeTooltipProps): React.JSX.Element => {
  const { promark_settings: t } = useI18n();
  const title = issue
    ? sprintf(
        issue.level === 'error' ? t.range_error : t.range_warning,
        formatLensParameterRange(issue.path, issue.range, isInch),
      )
    : undefined;

  return <Tooltip title={title}>{children}</Tooltip>;
};

export default RangeTooltip;
