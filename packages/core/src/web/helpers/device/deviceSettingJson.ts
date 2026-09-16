/**
 * Serialise a JSON device setting for `config set`.
 *
 * The value passes through two shlex splits on its way to the machine: fluxghost splits the
 * websocket command, then fluxmonitor splits the line it relays. Each pass consumes one level of
 * backslash escaping, so every quote has to survive twice.
 *
 * {"a":1}  ->  {\\\"a\\\":1}  -(fluxghost)->  {\"a\":1}  -(fluxmonitor)->  {"a":1}
 */
export const stringifyDeviceSettingJson = (value: unknown, replacer?: (key: string, val: any) => any): string =>
  JSON.stringify(value, replacer).replaceAll('"', '\\\\\\"');

export default stringifyDeviceSettingJson;
