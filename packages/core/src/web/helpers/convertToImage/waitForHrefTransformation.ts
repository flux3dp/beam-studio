/**
 * Waits for all SVGImageElements' href attributes to be transformed
 * from blob URLs to base64 data URLs. It does this by observing attribute
 * mutations, which is far more reliable than a timeout.
 *
 * @param elements An array of SVGImageElement objects to observe.
 * @returns A Promise that resolves when all hrefs are confirmed to be base64.
 */
export const waitForHrefTransformation = (elements: SVGImageElement[]): Promise<Array<true>> => {
  const transformationPromises = elements.map(
    (el) =>
      new Promise<true>((resolve, reject) => {
        // Check if the transformation is already complete.
        if (el.href.baseVal.startsWith('data:image')) {
          return resolve(true);
        }

        // If not, set up an observer to wait for the change.
        const observer = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
            // We only care about changes to the 'href' attribute.
            if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
              if (el.href.baseVal.startsWith('data:image')) {
                observer.disconnect(); // Clean up the observer
                resolve(true);

                return;
              }
            }
          }
        });

        // Start observing the element for attribute changes.
        observer.observe(el, { attributes: true });

        // Optional: Add a timeout to prevent waiting forever if something goes wrong.
        setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Timeout waiting for href transformation on element ${el.id}`));
        }, 5000); // 5-second timeout
      }),
  );

  return Promise.all(transformationPromises);
};
