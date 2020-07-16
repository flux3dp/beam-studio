const main = async () => {
    const electron = require('electron');
    console.log(electron);
    const {ipcRenderer: ipc} = electron;
    ipc.on('SVG_URL_TO_IMG_URL', (e, data) => {
        const {url, width, height, bb, imageRatio, id, strokeWidth} = data;
        console.log(data);
        const img = new Image(width + parseInt(strokeWidth / 2), height + parseInt(strokeWidth / 2));
        img.onload = async () => {
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = img.width + 1;
            imgCanvas.height = img.height + 1;
            const ctx = imgCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, width, height);
            const outCanvas =  document.createElement('canvas');
            outCanvas.width = Math.max(1, bb.width * imageRatio);
            outCanvas.height = Math.max(1, bb.height * imageRatio);
            const outCtx = outCanvas.getContext('2d');
            outCtx.imageSmoothingEnabled = false;
            outCtx.filter = 'brightness(0%)'
            outCtx.drawImage(imgCanvas, 0, 0, outCanvas.width, outCanvas.height, 0, 0, outCanvas.width, outCanvas.height);
            const imageBase64 = outCanvas.toDataURL('image/png');
            const res = await fetch(imageBase64);
            const imageBlob = await res.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            ipc.send('SVG_URL_TO_IMG_URL_DONE', {imageUrl, id});
        }
        img.src = url;
        console.log('start load');
    });
};

main();