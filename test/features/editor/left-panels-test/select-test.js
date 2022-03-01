const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Select Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Select', async function () {
    const { app } = require('../../../test');
    const polygon = await app.client.$('#left-Polygon');
    await polygon.click();

    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);

    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 1000));

    const result = await app.client.execute(() => {
      return svgCanvas.getSelectedElems();
    });
    expect(result.length).toEqual(1);

    const id = await app.client.execute(() => {
      const e = svgCanvas.getSelectedElems();
      return e.map((e) => { return e.getAttribute('id') });
    });
    expect(id).toEqual(["svg_1"]);
  });

  test('Check Multi-Select', async function () {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();

    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 300, y: 300, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();

    await mouseAction([
      { type: 'pointerMove', x: 400, y: 400, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 450, y: 450, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);

    await mouseAction([
      { type: 'pointerMove', x: 150, y: 150, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 500, y: 500, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await new Promise((r) => setTimeout(r, 1000));

    const result = await app.client.execute(() => {
      let g = svgCanvas.getTempGroup();
      let childNodes = Array.from(g.childNodes);
      const rectangle = document.getElementById('svg_1');
      const ellipse = document.getElementById('svg_2');
      const isRectInsideGroup = childNodes.includes(rectangle);
      const isEllipseInsideGroup = childNodes.includes(ellipse);
      return { isRectInsideGroup, isEllipseInsideGroup };
    });
    expect(result.isRectInsideGroup).toBe(true);
    expect(result.isEllipseInsideGroup).toBe(true);
  });
});
