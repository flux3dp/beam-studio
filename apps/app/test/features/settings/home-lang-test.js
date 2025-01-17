const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');

test('Init Check Deutsche Language', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);
    const option_Deutsche = await app.client.$('option[value="de"]');
    await option_Deutsche.click();
    const Deutsche = await app.client.$('h1.headline');
    await Deutsche.getText();
    expect(await Deutsche.getText()).toEqual('Sprache auswählen');   
});

test('Init Check English Language', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);
    const option_English = await app.client.$('option[value="en"]');
    await option_English.click();
    const English = await app.client.$('h1.headline');
    await English.getText();
    expect(await English.getText()).toEqual('Select Language');
});


test('Init Check Español Language', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);
    const option_Español = await app.client.$('option[value="es"]');
    await option_Español.click();
    const Español = await app.client.$('h1.headline');
    await Español.getText();
    expect(await Español.getText()).toEqual('Selecciona el idioma');
});

test('Init Check 日本語 Language', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);
    const option_ja = await app.client.$('option[value="ja"]');
    await option_ja.click();
    const ja = await app.client.$('h1.headline');
    await ja.getText();
    expect(await ja.getText()).toEqual('言語を選択');
});

test('Init Check 简体中文 Language', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);
    const option_zh_cn = await app.client.$('option[value="zh-cn"]');
    await option_zh_cn.click();
    const zh_cn = await app.client.$('h1.headline');
    await zh_cn.getText();
    expect(await zh_cn.getText()).toEqual('请选择你想使用的语言');
});

test('Init Check 繁體中文 Language', async function() {
    const { app } = require('../../test');
    await checkExist('.headline', 15000);
    const option_zh_tw = await app.client.$('option[value="zh-tw"]');
    await option_zh_tw.click();
    const zh_tw = await app.client.$('h1.headline');
    await zh_tw.getText();
    expect(await zh_tw.getText()).toEqual('請選擇你想使用的語言');

});