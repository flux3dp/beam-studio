const { checkExist, setAppPage } = require('../../../util/utils');

test('Check Preference Set Guide ', async function() {
    const { app } = require('../../../test');
    await setAppPage('#studio/settings');

    const openguide = await app.client.$('select#qa-set-guide option[value="TRUE"]');
    await openguide.click();

    const setguidecheck= await app.client.$('select#qa-set-groups-engraving');
    const setguidecheck2 = await setguidecheck.getAttribute('value');
    expect(setguidecheck2).toEqual('TRUE');

    const selectguidex = await app.client.$('input#qa-set-settings-guides-originx');
    await selectguidex.doubleClick();
    await app.client.keys(['Delete', '2', '0', 'Enter', "NULL"]);

    const selectguidey = await app.client.$('input#qa-set-settings-guides-originy');
    await selectguidey.doubleClick();
    await app.client.keys(['Delete', '3', '0', 'Enter', "NULL"]);
   
    const selectguidexcheck= await app.client.$('input#qa-set-settings-guides-originx');
    const selectguidexcheck2 = await selectguidexcheck.getAttribute('value');
    expect(selectguidexcheck2).toEqual('20');

    const selectguideycheck= await app.client.$('input#qa-set-settings-guides-originy');
    const selectguideycheck2 = await selectguideycheck.getAttribute('value');
    expect(selectguideycheck2).toEqual('30');

    const done = await app.client.$('div.btn.btn-done');
    await done.click();

    await checkExist('#svgcanvas',15000);

    await checkExist('#vertical_guide');
    await checkExist('#horizontal_guide');

    const verticalcheck= await app.client.$('#vertical_guide');
    const verticalcheck2 = await verticalcheck.getAttribute('x1');
    expect(verticalcheck2).toEqual('200');

    const horizontalcheck= await app.client.$('#horizontal_guide');
    const horizontalcheck2 = await horizontalcheck.getAttribute('y1');
    expect(horizontalcheck2).toEqual('300');
});
