// @ts-expect-error don't has type definition
import ImageTracer from 'imagetracerjs';

onmessage = async ({ data: { imageData } }) => {
  if (!imageData) return;

  const startTime = performance.now();
  const svg = ImageTracer.imagedataToSVG(imageData, 'detailed').replace(/<\/?svg[^>]*>/g, '');

  postMessage({ svg });

  console.log('image-tracer.worker.ts operationTime', performance.now() - startTime);
};
