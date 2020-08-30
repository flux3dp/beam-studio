//Some Custom Function for Jimp Module

    //Do four directional blur and take max value
    const stampBlur = (image, r) => {
        const blurredImages = [];
        blurredImages[0] = oneDirectionalLinearBlur(image.clone(), r, 'left');
        blurredImages[1] = oneDirectionalLinearBlur(image.clone(), r, 'right');
        blurredImages[2] = oneDirectionalLinearBlur(image.clone(), r, 'up');
        blurredImages[3] = oneDirectionalLinearBlur(image, r, 'down');
        for (let i = 0; i < image.bitmap.data.length; i++) {
            if (i % 4 !== 3) {
                image.bitmap.data[i] = Math.min(
                    blurredImages[0].bitmap.data[i],
                    blurredImages[1].bitmap.data[i],
                    blurredImages[2].bitmap.data[i],
                    blurredImages[3].bitmap.data[i],
                );
            }
        }
        return image;
    }

    //dir 
    const oneDirectionalGaussianBlur = (image, r, dir) => {
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        const r1 = r + 1;
        const blurDecay = 1 + 1 / r;
        const denominator = blurDecay > 1 ? (blurDecay ** r1 - 1) / (blurDecay - 1) : r1;
        const windowR = Array(r1).fill(0);
        const windowG = Array(r1).fill(0);
        const windowB = Array(r1).fill(0);
        const windowA = Array(r1).fill(0);
        let curR, curG, curB, curA, p, iLimit, jLimit;
        if (dir === 'left' || dir === 'right') {
            iLimit = h;
            jLimit = w;
        } else if (dir === 'up' || dir === 'down') {
            iLimit = w;
            jLimit = h;
        }
        for (let i = 0; i < iLimit; i++) {
            for (let j = 0; j < jLimit; j++) {
                let x, y;
                if (dir === 'left') {
                    x = w - 1 - j;
                    y = i;
                } else if (dir === 'right') {
                    x = j;
                    y = i;
                } else if (dir === 'up') {
                    x = i;
                    y = h - 1 - j;
                } else if (dir === 'down') {
                    x = i;
                    y = j;
                }
                p = (w * y + x) << 2;
                if (x === 0) {
                    curR = image.bitmap.data[p] * denominator;
                    curG = image.bitmap.data[p + 1] * denominator;
                    curB = image.bitmap.data[p + 2] * denominator;
                    curA = image.bitmap.data[p + 3] * denominator;
                    windowR.fill(image.bitmap.data[p]);
                    windowG.fill(image.bitmap.data[p + 1]);
                    windowB.fill(image.bitmap.data[p + 2]);
                    windowA.fill(image.bitmap.data[p + 3]);
                } else {
                    curR = (curR - windowR.shift()) / blurDecay + image.bitmap.data[p] * blurDecay ** r;
                    curG = (curG - windowG.shift()) / blurDecay + image.bitmap.data[p + 1] * blurDecay ** r;
                    curB = (curB - windowB.shift()) / blurDecay + image.bitmap.data[p + 2] * blurDecay ** r;
                    curA = (curA - windowA.shift()) / blurDecay + image.bitmap.data[p + 3] * blurDecay ** r;
                    windowR.push(image.bitmap.data[p]);
                    windowG.push(image.bitmap.data[p + 1]);
                    windowB.push(image.bitmap.data[p + 2]);
                    windowA.push(image.bitmap.data[p + 3]);
                }
                image.bitmap.data[p] = Math.floor(curR / denominator);
                image.bitmap.data[p + 1] = Math.floor(curG / denominator);
                image.bitmap.data[p + 2] = Math.floor(curB / denominator);
                image.bitmap.data[p + 3] = 255;
            }
        }
        return image;
    }

    const oneDirectionalLinearBlur = (image, r, dir) => {
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        const r1 = r + 1;
        const interval = 0.3;
        const denominator = (1 + 1 + r * interval) * r1 / 2;
        const windowR = Array(r1).fill(0);
        const windowG = Array(r1).fill(0);
        const windowB = Array(r1).fill(0);
        const windowA = Array(r1).fill(0);
        let curR, curG, curB, curA, sumR, sumG, sumB, sumA, lastR, lastG, lastB, lastA, p, iLimit, jLimit;
        if (dir === 'left' || dir === 'right') {
            iLimit = h;
            jLimit = w;
        } else if (dir === 'up' || dir === 'down') {
            iLimit = w;
            jLimit = h;
        }
        for (let i = 0; i < iLimit; i++) {
            for (let j = 0; j < jLimit; j++) {
                let x, y;
                if (dir === 'left') {
                    x = w - 1 - j;
                    y = i;
                } else if (dir === 'right') {
                    x = j;
                    y = i;
                } else if (dir === 'up') {
                    x = i;
                    y = h - 1 - j;
                } else if (dir === 'down') {
                    x = i;
                    y = j;
                }
                p = (w * y + x) << 2;
                if (x === 0) {
                    curR = image.bitmap.data[p] * denominator;
                    sumR = image.bitmap.data[p] * r1
                    curG = image.bitmap.data[p + 1] * denominator;
                    sumG = image.bitmap.data[p + 1] * r1
                    curB = image.bitmap.data[p + 2] * denominator;
                    sumB = image.bitmap.data[p + 2] * r1
                    curA = image.bitmap.data[p + 3] * denominator;
                    sumA = image.bitmap.data[p + 3] * r1
                    windowR.fill(image.bitmap.data[p]);
                    windowG.fill(image.bitmap.data[p + 1]);
                    windowB.fill(image.bitmap.data[p + 2]);
                    windowA.fill(image.bitmap.data[p + 3]);
                } else {
                    lastR = windowR.shift();
                    lastG = windowG.shift();
                    lastB = windowB.shift();
                    lastA = windowA.shift();
                    curR += image.bitmap.data[p] * (1 + r * interval) - lastR - interval * (sumR - lastR);
                    sumR += image.bitmap.data[p] - lastR;
                    curG += image.bitmap.data[p + 1] * (1 + r * interval) - lastG - interval * (sumG - lastG);
                    sumG += image.bitmap.data[p + 1] - lastG;
                    curB += image.bitmap.data[p + 2] * (1 + r * interval) - lastB - interval * (sumB - lastB);
                    sumB += image.bitmap.data[p + 2] - lastB;
                    curA += image.bitmap.data[p + 3] * (1 + r * interval) - lastA - interval * (sumA - lastA);
                    sumA += image.bitmap.data[p + 3] - lastA;
                    windowR.push(image.bitmap.data[p]);
                    windowG.push(image.bitmap.data[p + 1]);
                    windowB.push(image.bitmap.data[p + 2]);
                    windowA.push(image.bitmap.data[p + 3]);
                }
                image.bitmap.data[p] = Math.floor(curR / denominator);
                image.bitmap.data[p + 1] = Math.floor(curG / denominator);
                image.bitmap.data[p + 2] = Math.floor(curB / denominator);
                image.bitmap.data[p + 3] = 255;
            }
        }
        return image;
    }

    const regulateBlurredImage = (image) => {
        let brightness = image.bitmap.data.filter((p, i)=> i % 4 === 0);
        let max = brightness[0], min = brightness[0];
        brightness.forEach((v) => {
            max = Math.max(v, max);
            min = Math.min(v, min);
        });
        const BLACK_CAP = 0;
        for (let i=0; i<image.bitmap.data.length; i+=4) {
            let v = image.bitmap.data[i];
            v = (v - min) / (max - min);
            if (v < 0.3) {
                v = Math.round((v) ** 1.5 * (255 - BLACK_CAP)) + BLACK_CAP;
            } else if (v < 0.7) {
                const power = 1.5 + 2.5 * (v - 0.3);
                v = Math.round((v) ** power * (255 - BLACK_CAP)) + BLACK_CAP;
            } else {
                const power = 2.5 + 5 * (v - 0.7);
                v = Math.round((v) ** power * (255 - BLACK_CAP)) + BLACK_CAP;
            }
            
            if (v < BLACK_CAP || v > 255) {
                console.log(v);
            }
            image.bitmap.data[i] = v;
            image.bitmap.data[i+1] = v;
            image.bitmap.data[i+2] = v;
            image.bitmap.data[i+3] = 255;
        }
    }

    const binarizeImage = async (image, threshold) => {
        await image.greyscale();
        for (let i=0; i<image.bitmap.data.length; i+=4) {
            if(image.bitmap.data[i] >= threshold || image.bitmap.data[i+3] === 0) {
                image.bitmap.data[i] = 255;
                image.bitmap.data[i+1] = 255;
                image.bitmap.data[i+2] = 255;
                image.bitmap.data[i+3] = 0;
            } else {
                image.bitmap.data[i] = 0;
                image.bitmap.data[i+1] = 0;
                image.bitmap.data[i+2] = 0;
                image.bitmap.data[i+3] = 255;
            }
        }
    }

    export default {
        oneDirectionalGaussianBlur,
        oneDirectionalLinearBlur,
        stampBlur,
        regulateBlurredImage,
        binarizeImage
    }