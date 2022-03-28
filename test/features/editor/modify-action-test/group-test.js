const { checkExist, checkNotExist, setReload, checknotExist } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Group Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Group', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();

    const result = await app.client.execute(() => {
      let g = svgCanvas.getTempGroup();
      let childNodes = Array.from(g.childNodes);
      const rectangle = document.getElementById('svg_1');
      const ellipse = document.getElementById('svg_2');
      const polygon = document.getElementById('svg_2');
      const isRectInsideGroup = childNodes.includes(rectangle);
      const isEllipseInsideGroup = childNodes.includes(ellipse);
      const isPolygonInsideGroup = childNodes.includes(polygon);
      return { isRectInsideGroup, isEllipseInsideGroup, isPolygonInsideGroup };
    });
    expect(result.isRectInsideGroup).toBeTruthy();
    expect(result.isEllipseInsideGroup).toBeTruthy();
    expect(result.isPolygonInsideGroup).toBeTruthy();

    const group = await app.client.$('#group');
    await group.click();
    await checkExist('#svg_5');

    const result2 = await app.client.execute(() => {
      const groupVisible = svgCanvas.getVisibleElements();
      const groupLength = $('#svg_5').children().length;
      return { groupLength, groupVisible };
    });
    expect(result2.groupLength).toEqual(3);
    expect(result2.groupVisible.length).toEqual(1);
  });

  test('Check Ungroup', async function () {
    const { app } = require('../../../test');
    await drawing();
    await selectAll();
    const group = await app.client.$('#group');
    await group.click();
    await selectAll();
    const unGroup = await app.client.$('#ungroup');
    await unGroup.click();
    await checkExist('#svg_6');
    await checkNotExist('#svg_5');
    const select = await app.client.$('#left-Cursor');
    await select.click();

    const result = await app.client.execute(() => {
      const groupVisible = svgCanvas.getVisibleElements();
      const groupLength = $('#svg_6').children().length;
      return { groupLength, groupVisible };
    });
    expect(result.groupLength).toEqual(0);
    expect(result.groupVisible.length).toEqual(3);
  });

  async function drawing() {
    const { app } = require('../../../test');
    const rect = await app.client.$('#left-Rectangle');
    await rect.click();
    await mouseAction([
      { type: 'pointerMove', x: 200, y: 200, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 250, y: 250, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_1');

    const elli = await app.client.$('#left-Ellipse');
    await elli.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 350, y: 350, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_2');

    const poly = await app.client.$('#left-Polygon');
    await poly.click();
    await mouseAction([
      { type: 'pointerMove', x: 260, y: 260, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 270, y: 270, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
    await checkExist('#svg_3');
  };

  async function selectAll() {
    const { app } = require('../../../test');
    const select = await app.client.$('#left-Cursor');
    await select.click();
    await mouseAction([
      { type: 'pointerMove', x: 100, y: 100, duration: 100, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerMove', x: 600, y: 600, duration: 1000, },
      { type: 'pointerUp', button: 0, },
    ]);
  };
});
