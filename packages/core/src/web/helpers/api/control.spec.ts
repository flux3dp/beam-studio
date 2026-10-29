jest.mock('@core/helpers/websocket', () => jest.fn());
jest.mock('@core/helpers/rsa-key', () => jest.fn(() => 'rsa-key'));

import Control from './control';

/**
 * The device's control task takes one recv() per command (≤ 4096 bytes, one TCP segment over
 * a network), so `galvoExec` sends anything longer in 1024-character pieces behind a
 * `chunk_begin`, each piece acknowledged, the last answered by the command itself.
 */
describe('Control.galvoExec', () => {
  const makeControl = (answers: (command: string) => string) => {
    const control = new Control('uuid');
    const sent: string[] = [];

    (control as any).mode = 'control_task';
    jest.spyOn(control, 'useWaitAnyResponse').mockImplementation(async (command: string) => {
      sent.push(command);

      return { data: answers(command) };
    });

    return { control, sent };
  };

  test('a short command goes out as one message', async () => {
    const { control, sent } = makeControl(() => 'ok');

    await expect(control.galvoExec({ head: 12, op: 'frame' })).resolves.toBe('ok');
    expect(sent).toEqual(['galvo_exec {"head":12,"op":"frame"}']);
  });

  test('a long command is announced, cut into 1024-character pieces, and answered by its last piece', async () => {
    const paths = Array.from({ length: 400 }, (_, i) => [
      [i, i],
      [i + 1, i],
    ]);
    const payload = { head: 12, op: 'paths', paths };
    const command = `galvo_exec ${JSON.stringify(payload)}`;
    const { control, sent } = makeControl((cmd) =>
      cmd === command.slice(-(command.length % 1024)) ? 'fail BAD_ARGS' : 'ok',
    );

    expect(command.length).toBeGreaterThan(1024);

    await expect(control.galvoExec(payload)).resolves.toBe('fail BAD_ARGS');

    expect(sent[0]).toBe(`chunk_begin ${command.length} 1024`);

    const pieces = sent.slice(1);

    expect(pieces.join('')).toBe(command);
    expect(pieces.slice(0, -1).every((p) => p.length === 1024)).toBe(true);
    expect(pieces[pieces.length - 1].length).toBe(command.length % 1024 || 1024);
  });

  test('stops at the first piece the device refuses', async () => {
    const payload = {
      head: 12,
      op: 'paths',
      paths: Array.from({ length: 300 }, (_, i) => [
        [i, 0],
        [i, 1],
      ]),
    };
    const { control, sent } = makeControl((cmd) => (cmd.startsWith('chunk_begin') ? 'ok' : 'fail BAD_CHUNK'));

    await expect(control.galvoExec(payload)).resolves.toBe('fail BAD_CHUNK');
    expect(sent).toHaveLength(2);
  });

  test('refuses to chunk a command that is not ASCII', async () => {
    const payload = { head: 12, note: 'é'.repeat(1100), op: 'paths' };
    const { control, sent } = makeControl(() => 'ok');

    await expect(control.galvoExec(payload)).rejects.toThrow('ASCII');
    expect(sent).toEqual([]);
  });

  test('is refused outside the control task', async () => {
    const control = new Control('uuid');

    await expect(control.galvoExec({})).rejects.toThrow();
  });
});
