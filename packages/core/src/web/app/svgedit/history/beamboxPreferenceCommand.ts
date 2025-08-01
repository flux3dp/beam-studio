import type { BeamboxPreferenceKey, BeamboxPreferenceValue } from '@core/app/actions/beambox/beambox-preference';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import type { IBatchCommand, ICommand } from '@core/interfaces/IHistory';

import { BaseHistoryCommand } from './history';

export class BeamboxPreferenceCommand<Key extends BeamboxPreferenceKey> extends BaseHistoryCommand implements ICommand {
  elements = () => [];

  type = () => 'BeamboxPreferenceCommand';

  constructor(
    private key: Key,
    private oldValue: BeamboxPreferenceValue<Key>,
    private newValue: BeamboxPreferenceValue<Key>,
    private isGlobalPreference: boolean = true,
  ) {
    super();
  }

  doApply = (): void => {
    beamboxPreference.write(this.key, this.newValue, this.isGlobalPreference);
  };

  doUnapply = (): void => {
    beamboxPreference.write(this.key, this.oldValue, this.isGlobalPreference);
  };
}

export function changeBeamboxPreferenceValue<Key extends BeamboxPreferenceKey>(
  key: Key,
  value: BeamboxPreferenceValue<Key>,
  { isGlobalPreference = true, parentCmd }: { isGlobalPreference?: boolean; parentCmd?: IBatchCommand } = {},
): BeamboxPreferenceCommand<Key> {
  const oldValue = beamboxPreference.read(key);

  beamboxPreference.write(key, value, isGlobalPreference);

  const cmd = new BeamboxPreferenceCommand(key, oldValue, value, isGlobalPreference);

  if (parentCmd) parentCmd.addSubCommand(cmd);

  return cmd;
}

export default BeamboxPreferenceCommand;
