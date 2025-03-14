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
  ) {
    super();
  }

  doApply = (): void => {
    beamboxPreference.write(this.key, this.newValue);
  };

  doUnapply = (): void => {
    beamboxPreference.write(this.key, this.oldValue);
  };
}

export function changeBeamboxPreferenceValue<Key extends BeamboxPreferenceKey>(
  key: Key,
  value: BeamboxPreferenceValue<Key>,
  opts: { parentCmd?: IBatchCommand } = {},
): BeamboxPreferenceCommand<Key> {
  const { parentCmd } = opts;
  const oldValue = beamboxPreference.read(key);

  beamboxPreference.write(key, value);

  const cmd = new BeamboxPreferenceCommand(key, oldValue, value);

  if (parentCmd) parentCmd.addSubCommand(cmd);

  return cmd;
}

export default BeamboxPreferenceCommand;
