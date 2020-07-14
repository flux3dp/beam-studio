define([
    'helpers/i18n',
    'helpers/api/config',
    'app/contexts/AlertCaller',
    'app/constants/alert-constants',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
],function(
    i18n,
    Config,
    Alert,
    AlertConstants,
    ProgressActions,
    ProgressConstants,
){
/*  Beam Format
   =================================================================================
  |   Block Name   |    Length    |           Contents                              |
   =================================================================================
  |   Signature    |    5 Bytes   | [66, 101, 97, 109, 2] : Beam + version          |
   =================================================================================
  |  Header Length |     VINT     | the size of vint will grow according to value   |
   =================================================================================
   

   =================================================================================
  |     Header     |  header len  |                                                 |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   Metadata Len |     VINT     | indicate size of metadata                       |
   ---------------------------------------------------------------------------------
  |    Metadata    | ↖            |string                                           |
   ---------------------------------------------------------------------------------
  | svg content Len |    VINT     | indicate size of svg content block              |
   ---------------------------------------------------------------------------------
  | image source Len |     VINT   | indicate size of image source block             |
   ---------------------------------------------------------------------------------

    Blocks:

   =================================================================================
  |   Svg Content  |  content len |         Block Containing Svg contents           |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Bytes   | 0x01 for svg content                            |
   ---------------------------------------------------------------------------------
  |  string length |     VINT     | indicate size of svg string                     |
   ---------------------------------------------------------------------------------
  |   svg string   | ↖            | string                                          |
   ---------------------------------------------------------------------------------

   =================================================================================
  |  Image Source  |      ...     |         Block Containing Image Source           |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Bytes   | 0x02 for svg content                            |
   ---------------------------------------------------------------------------------
  |     length     |     VINT     | indicate size of remaining block                |
   ---------------------------------------------------------------------------------
  |  Image Id Len  |    1 Byte    | Len of image id                                 |
   ---------------------------------------------------------------------------------
  |       Id       | ↖            | Image Id                                        |
   ---------------------------------------------------------------------------------
  |    Image Len   |     VINT     | Len of image                                    |
   ---------------------------------------------------------------------------------
  |      Image     | ↖            | Image Source, which can be read as Blob         |
   ---------------------------------------------------------------------------------
  |                 Repeat Image Id Len, Image Id, Image Len, Image                 |
   ---------------------------------------------------------------------------------

*/

    const fs = require('fs');
    const electronRemote = require('electron').remote;
    const { dialog } = electronRemote;
    const getFilePath = async (title, allFiles, extensionName, extensions, filename) => {
        const isMac = process.platform === 'darwin';
        const isLinux = process.platform === 'linux';
        const options = {
            defaultPath: isLinux ? `${filename}.${extensions[0]}` : filename,
            title,
            filters: [
                { name: isMac ? `${extensionName} (*.${extensions[0]})` : extensionName, extensions },
                { name: allFiles, extensions: ['*'] }
            ]
        }
        return new Promise((resolve) => {
            dialog.showSaveDialog(options, (filePath) => {
                resolve(filePath);
            })
        });
    };

    const writeUInt64BEToBuffer = (buffer, value, offset=0) => {
        buffer.writeUInt32BE(Math.floor(value / 2 ** 32), offset);
        buffer.writeUInt32BE(value % 2 ** 32, offset + 4);
        return offset + 8;
    }

    const readUInt64BEfromBuffer = (buffer, offset=0) => {
        let res = 0;
        res += buffer.readUInt32BE(offset) * 2 ** 32;
        res += buffer.readUInt32BE(offset + 4);
        return res;
    }

    // Create VInt Buffer, first bit indicate continue or not, other 7 bits represent value
    const valueToVIntBuffer = (value) => {
        const a = [];
        while (value > 127) {
            const b = value % 128 + 128;
            a.push(b);
            value = Math.floor(value / 128);
        }
        a.push(value);
        return new Buffer.from(a);
    }

    const readVInt = (buffer, offset=0) => {
        let v = 0;
        let currentByte = 0;
        while (true) {
            const b = buffer.readUInt8(offset);
            offset += 1;
            v += (b % 128) * 2 ** (7 * currentByte);
            currentByte += 1;
            if (b < 128) break;
        }
        return {
            value: v,
            offset
        };
    }

    const localHeaderTypeBuffer = (type) => {
        switch (type) {
            case 'svgContent':
                return new Buffer.from([0x01]);
            case 'imageSource':
                return new Buffer.from([0x02]);
        }
    }

    // 1 Byte Type (0x01 for svg content) + ? bytes vint length + length bytes svg string
    const genertateSvgBlockBuffer = (svgString) => {
        const typeBuf = localHeaderTypeBuffer('svgContent');
        const svgStringBuf = new Buffer.from(svgString);
        const lengthVintBuf = valueToVIntBuffer(svgStringBuf.length);
        return Buffer.concat([typeBuf, lengthVintBuf, svgStringBuf]);
    }

    // 1 Byte Type (0x02 for svg content) + ? bytes vint length + length bytes svg string
    const generateImageSourceBlockBuffer = (imageSources) => {
        let imageSourceBlockBuffer = localHeaderTypeBuffer('imageSource');
        let tempbuffer = new Buffer.alloc(0);
        for (let id in imageSources) {
            const idSizeBuf = new Buffer.alloc(1);
            const idBuf = new Buffer.from(id);
            idSizeBuf.writeUInt8(idBuf.length);
            const imageBuf = Buffer.from(imageSources[id]);
            const imageSizeBuf = valueToVIntBuffer(imageBuf.length);
            tempbuffer = Buffer.concat([tempbuffer, idSizeBuf, idBuf, imageSizeBuf, imageBuf]);
        }
        imageSourceBlockBuffer = Buffer.concat([imageSourceBlockBuffer, valueToVIntBuffer(tempbuffer.length), tempbuffer]);
        return imageSourceBlockBuffer;
    }

    const saveBeam = async (path, svgString, imageSources) => {
        const stream = fs.createWriteStream(path, {flags: 'w'});
        const signatureBuffer = new Buffer.from([66, 101, 97, 109, 2]); //Bvg{version in uint} max to 255  
        const svgBlockBuf = genertateSvgBlockBuffer(svgString);
        const imageSourceBlockBuffer = generateImageSourceBlockBuffer(imageSources);
        const metaDataBuf = new Buffer.from('Hi, I am meta data O_<');
        const headerBuffer = Buffer.concat([valueToVIntBuffer(metaDataBuf.length), metaDataBuf, valueToVIntBuffer(svgBlockBuf.length), valueToVIntBuffer(imageSourceBlockBuffer.length)]);
        const headerSizeBuf = valueToVIntBuffer(headerBuffer.length);
        stream.write(Buffer.concat([signatureBuffer, headerSizeBuf, headerBuffer, svgBlockBuf, imageSourceBlockBuffer]));
        // Ending block
        stream.write(Buffer.from([0x00]));
        stream.close();
    };

    const readHeader = (headerBuf) => {
        let vint;
        let offset = 0;
        vint = readVInt(headerBuf, offset);
        offset = vint.offset;
        metadataSize = vint.value;
        const metaData = headerBuf.toString('utf-8', offset, offset + metadataSize);
        console.log(metaData);
        offset += metadataSize;
        vInt = readVInt(headerBuf, offset);
        const svgBlockSize = vInt.value;
        console.log('svgBlockSize', svgBlockSize); 
        offset = vInt.offset;
        vInt = readVInt(headerBuf, offset);
        const imageSourceBlockSize = vInt.value;
        console.log('Image Source block Size', imageSourceBlockSize);
    }

    const readBlocks = async (buf, offset) => {
        if (offset > buf.length) {
            console.warn('offset exceed buffer length');
            return -1;
        }
        const blockType = buf.readUInt8(offset);
        let vint, size;
        offset += 1;
        switch (blockType) {
            //Ending Block
            case 0:
                console.log('Ending Block');
                offset = -1;
                break;
            //Svg Content
            case 1:
                vint = readVInt(buf, offset);
                offset = vint.offset;
                size = vint.value;
                const svgString = buf.toString('utf-8', offset, offset + size);
                await svgEditor.importBvgStringAsync(svgString);
                offset += size;
                break;
            case 2:
                vint = readVInt(buf, offset);
                offset = vint.offset;
                size = vint.value;
                readImageSource(buf, offset, offset + size);
                offset += size
                break;
            default:
                console.error(`Unknown Block Type: ${blockType}`);
                offset = -1;
        }
        return offset;
    }

    const readImageSource = (buf, offset, end) => {
        while (offset < end) {
            const idSize = buf.readUInt8(offset);
            offset += 1;
            const id = buf.toString('utf-8', offset, offset + idSize);
            offset += idSize;
            const {value: imageSize, offset: newOffset} = readVInt(buf, offset);
            offset = newOffset;
            var blob = new Blob([buf.slice(offset, offset + imageSize)]);
            let src = URL.createObjectURL(blob);
            offset +=  imageSize;
            $(`#${id}`).attr('origImage', src);
        }
    }

    const readBeam = async (file) => {
        let data = await fetch(typeof file === 'string' ? file : file.path);
        data = await data.blob();
        data = await new Response(data).arrayBuffer();
        const buf = new Buffer.from(data);
        delete data;
        
        let offset = 0, vint;
        const signatureBuffer = buf.slice(offset, 5);
        console.log('Signature:', signatureBuffer.toString());
        offset += 5;
        const version = signatureBuffer.readUInt8(4);
        console.log('Bvg Version: ', version);
        vint = readVInt(buf, offset);
        const headerSize = vint.value;
        offset = vint.offset;
        const headerBuf = buf.slice(offset, offset + headerSize);
        readHeader(headerBuf);
        offset += headerSize;
        while(offset > 0) {
            offset = await readBlocks(buf, offset);
        }

        Alert.popAlertStackById('loading_image');
    };

    return {
        getFilePath,
        saveBeam,
        readBeam
    }
});