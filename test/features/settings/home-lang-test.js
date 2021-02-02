const { pause, checkExist, checkVisible, updateInput } = require('../../util/utils');

test('Check Deutsche Language', async function() {
    const { app } = require('../../test');

    await checkExist('.headline', 15000);
    //let setLanguageBtnText = await app.client.getText('.headline');
    //console.log(setLanguageBtnText);
    //expect(setLanguageBtnText).toEqual('Select Language');
    await app.client.click('option[value="de"]');
    let setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('Sprache auswählen');
    await new Promise((r) => setTimeout(r, 1000));
    //await app.client.click('a.btn');
});

test('Check English Language', async function() {
    const { app } = require('../../test');

    await app.client.click('option[value="en"]');
    setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('Select Language'); 
});

test('Check Español Language', async function() {
    const { app } = require('../../test');

    await app.client.click('option[value="es"]');
    setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('Selecciona el idioma'); 
});

test('Check 日本語 Language', async function() {
    const { app } = require('../../test');

    await app.client.click('option[value="ja"]');
    setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('言語を選択'); 
});

test('Check 简体中文 Language', async function() {
    const { app } = require('../../test');

    await app.client.click('option[value="zh-cn"]');
    setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('请选择你想使用的语言'); 
});

test('Check 繁體中文 Language', async function() {
    const { app } = require('../../test');

    await app.client.click('option[value="zh-tw"]');
    setLanguageBtnText = await app.client.getText('.headline');
    console.log(setLanguageBtnText);
    expect(setLanguageBtnText).toEqual('請選擇你想使用的語言'); 
    await app.client.click('a.btn');
});