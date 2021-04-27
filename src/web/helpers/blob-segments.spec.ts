import blobSegments from './blob-segments';

test('test blob-segments', () => {
  const blob = new Blob(['testing'], { type: 'application/pdf' });
  Object.defineProperty(blob, 'size', { value: 4097 });
  const callback = jest.fn();
  blobSegments(blob, callback);
  expect(callback).toHaveBeenCalledTimes(2);
});
