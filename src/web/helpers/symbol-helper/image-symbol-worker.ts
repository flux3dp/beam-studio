onmessage = async (e) => {
    //console.log('I\'m worker O_<');
    const {type} = e.data;
    switch (type) {
        case 'svgStringToBlob':
            const {svgString} = e.data;
            let svgBlob = new Blob([svgString], {
                type: 'image/svg+xml;charset=utf-8'
            });
            postMessage(svgBlob, null);
            break;
        case 'imageDataToBlob':
            const {imageData, bb, imageRatio} = e.data;
            const imgCanvas = new OffscreenCanvas(imageData.width, imageData.height);
            const imgCtx = imgCanvas.getContext('2d');
            imgCtx.imageSmoothingEnabled = false;
            imgCtx.putImageData(imageData, 0, 0);
            const outCanvas = new OffscreenCanvas(Math.max(1, bb.width * imageRatio), Math.max(1, bb.height * imageRatio));
            const outCtx = outCanvas.getContext('2d');
            outCtx.imageSmoothingEnabled = false;
            outCtx.drawImage(imgCanvas, bb.x * imageRatio, bb.y * imageRatio, outCanvas.width, outCanvas.height, 0, 0, outCanvas.width, outCanvas.height);
            const imageBlob = await outCanvas.convertToBlob({type: 'image/png'});
            postMessage(imageBlob, null);
            break;
    }
};
