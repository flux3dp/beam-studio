const { checkExist, setReload } = require('../../../util/utils');
const { mouseAction } = require('../../../util/actions');

describe('Verify Mirror Tool', () => {
  beforeEach(() => {
    setReload();
    checkExist('#svgcanvas', 15000);
  });

  test('Check Horizontal Flip', async function () {
    const { app } = require('../../../test');
    await typing();
    const horizontalBtn = await app.client.$('div#horizontal_flip.tool-btn');
    await horizontalBtn.click();
    const svg = await app.client.$('#svg_1');
    const str = await svg.getAttribute('transform');
    expect(str.substring(7, 15)).toEqual('-1,0,0,1')
  });

  test('Check Vertical Flip', async function () {
    const { app } = require('../../../test');
    await typing();
    const verticalBtn = await app.client.$('div#vertical_flip.tool-btn');
    await verticalBtn.click();
    const svg = await app.client.$('#svg_1');
    const str = await svg.getAttribute('transform');
    expect(str.substring(7, 15)).toEqual('1,0,0,-1');
  });

  async function typing() {
    const { app } = require('../../../test');
    const text = await app.client.$('#left-Text');
    await text.click();
    await mouseAction([
      { type: 'pointerMove', x: 300, y: 300, duration: 10, },
      { type: 'pointerDown', button: 0, },
      { type: 'pointerUp', button: 0, },
    ]);
    await app.client.keys(['MIRROR', 'Space', 'TEST']);
  };
});
