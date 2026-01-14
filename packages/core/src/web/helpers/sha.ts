export async function sha256(message = ''): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API not available. Ensure you are using HTTPS or localhost.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
