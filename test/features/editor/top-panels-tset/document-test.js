const { checkExist } = require('../../../util/utils');

test('Change Speed', async function() {
    const { app } = require('../../../test');
    await checkExist('#svgcanvas',15000);
    await app.client.execute(() => {
        Dialog.showDocumentSettings()
    });
});
