/**
 * The control socket rejects with the raw response object -- `{ status: 'error', error: [...] }`
 * from FLUXGhost's send_error -- not with an Error, so interpolating it into a message yields
 * "[object Object]". Turn whatever came back into something readable.
 */
export const describeControlSocketError = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  if (error && typeof error === 'object') {
    const { error: symbols, info, status } = error as { error?: string | string[]; info?: string; status?: string };
    const text = [Array.isArray(symbols) ? symbols.join(' ') : symbols, info].filter(Boolean).join(' ');

    if (text) return status && status !== 'error' ? `${status}: ${text}` : text;
  }

  return String(error);
};

export default describeControlSocketError;
