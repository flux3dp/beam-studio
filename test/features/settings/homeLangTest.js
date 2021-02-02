const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');

test('Check language', async function() {
    const { app } = require('../../test');

    await checkExist('.headline', 15000);
    let setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('Select Language');
    await app.client.click('option[value="zh-tw"]');
    setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('請選擇你想使用的語言');
    await new Promise((r) => setTimeout(r, 1000));
    await app.client.click('a.btn');
});