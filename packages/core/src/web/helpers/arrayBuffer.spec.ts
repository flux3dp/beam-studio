import arrayBuffer from './arrayBuffer';

test('test array buffer', async () => {
  const blob = new Blob(['123']);
  const buffer = await arrayBuffer(blob);
  const data = new Int8Array(buffer);
  expect(data[0]).toEqual(49);
  expect(data[1]).toEqual(50);
  expect(data[2]).toEqual(51);
});
