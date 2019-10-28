define([
], function (
) {

    let _instance = null;
    const request = require('request');
    // Core
    class NounProjectAPI {
        constructor() {
            const key = '3756822123b24cdfb9b9b2107ba3d30c';
            const secret = '41f7b6d0575d4d0f8a3abecf70e6216c';
            this.key = key;
            this.secret = secret;
            this.oauth = {
                consumer_key: this.key || '',
                consumer_secret: this.secret || ''
            }
        }

        async get() {
            this.oauth.get(
                'http://api.thenounproject.com/icon/1477538',
                null,
                null,
                async function (e, data, res){
                    if (e) console.error(e);
                    data = JSON.parse(data).icon;
                    console.log(data);
                    if (data.icon_url) {

                    } else {
                        let image;
                        image = await fetch(data.preview_url);
                        image = await image.blob();
                        svgEditor.readImage(image);
                    }
                }
            )
        }

        async getIconsByTerms(term) {
            request({
                url: encodeURI(`http://api.thenounproject.com/icons/${term}?limit_to_public_domain=1`),
                method: 'GET',
                oauth: this.oauth
            }, async function (error, res, data){
                if (error) console.error(error);
                data = JSON.parse(data).icons;
                let icon = data[0];
                if (icon.icon_url) {
                    let image;
                    image = await fetch(icon.icon_url);
                    image = await image.blob();
                    svgEditor.importSvg(image);
                } else {
                    let image;
                    image = await fetch(icon.preview_url);
                    image = await image.blob();
                    svgEditor.readImage(image);
                }
            });
        }

        async getIconById(id) {
            request({
                url: encodeURI(`http://api.thenounproject.com/icon/${id}`),
                method: 'GET',
                oauth: this.oauth
            }, async function (error, res, data){
                if (error) console.error(error);
                data = JSON.parse(data).icon;
                console.log(data)
                let icon = data;
                if (icon.icon_url) {
                    let image;
                    image = await fetch(icon.icon_url);
                    image = await image.blob();
                    svgEditor.importSvg(image);
                } else {
                    let image;
                    image = await fetch(icon.preview_url);
                    image = await image.blob();
                    svgEditor.readImage(image);
                }
            });
        }

        async postNotifyPublish(id) {
            request({
                url: encodeURI("http://api.thenounproject.com/notify/publish"),
                method: 'POST',
                oauth: this.oauth,
                json: {
                    "icons": "1477538"
                }
            }, async function (error, res, data){
                if (error) console.error(error);
                console.log(res);
                console.log(data);
            });
        }
    }
    NounProjectAPI.get_instance = () => {
        if (_instance === null) {
            _instance = new NounProjectAPI();
        }
        return _instance;
    };

    return NounProjectAPI.get_instance();
});
