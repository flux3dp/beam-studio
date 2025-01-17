/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import beamboxPreference from 'app/actions/beambox/beambox-preference';
import { IBatchCommand, ICommand } from 'interfaces/IHistory';

import { BaseHistoryCommand } from './history';

class BeamboxPreferenceCommand extends BaseHistoryCommand implements ICommand {
  private key: string;

  private oldValue: any;

  private newValue: any;

  elements = () => [];

  type = () => 'BeamboxPreferenceCommand';

  constructor(key: string, oldValue: any, newValue: any) {
    super();
    this.key = key;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  doApply = (): void => {
    beamboxPreference.write(this.key, this.newValue);
  };

  doUnapply = (): void => {
    beamboxPreference.write(this.key, this.oldValue);
  };
}

export const changeBeamboxPreferenceValue = (
  key: string,
  value: any,
  opts: { parentCmd?: IBatchCommand } = {}
): BeamboxPreferenceCommand => {
  const { parentCmd } = opts;
  const oldValue = beamboxPreference.read(key);
  beamboxPreference.write(key, value);
  const cmd = new BeamboxPreferenceCommand(key, oldValue, value);
  if (parentCmd) parentCmd.addSubCommand(cmd);
  return cmd;
};

export default BeamboxPreferenceCommand;
