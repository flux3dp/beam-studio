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
  | Thumbnail Len |     VINT   | indicate size of Thumbnail block                   |
    --------------------------------------------------------------------------------

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

   =================================================================================
  |   Thumbnail    |  content len |         Block Containing Thumbnail              |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Bytes   | 0x03 for Thumbnail                              |
   ---------------------------------------------------------------------------------
  |      size      |     VINT     | indicate size of image                          |
   ---------------------------------------------------------------------------------
  |      Image     | ↖            | Image binary of thumbnail (jpeg)                |
   ---------------------------------------------------------------------------------

   =================================================================================
  | MISC DATA(JSON)|  content len |    Block Containing json string of Misc. Data   |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Bytes   | 0x04                                            |
   ---------------------------------------------------------------------------------
  |      size      |     VINT     | indicate size of json string                    |
   ---------------------------------------------------------------------------------
  |    content     | ↖            | json string of misc data                        |
   ---------------------------------------------------------------------------------

*/
import { Buffer } from 'buffer';

import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Progress from '@core/app/actions/progress-caller';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useVariableTextState, type VariableTextState } from '@core/app/stores/variableText';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { importBvgString } from '@core/app/svgedit/operations/import/importBvg';
import workareaManager from '@core/app/svgedit/workarea';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';
import { hasVariableText } from '@core/helpers/variableText';
import type { CurveEngraving } from '@core/interfaces/ICurveEngraving';
import type { IBatchCommand } from '@core/interfaces/IHistory';

interface MiscData {
  ce?: CurveEngraving;
  vt?: VariableTextState;
}

// Create VInt Buffer, first bit indicate continue or not, other 7 bits represent value
const valueToVIntBuffer = (value) => {
  const a: number[] = [];
  let remainingValue = value;

  while (remainingValue > 127) {
    const b = (remainingValue % 128) + 128;

    a.push(b);
    remainingValue = Math.floor(remainingValue / 128);
  }
  a.push(remainingValue);

  return Buffer.from(a);
};

const readVInt = (buffer, offset = 0) => {
  let v = 0;
  let currentByte = 0;
  let currentOffset = offset;

  while (true) {
    const b = buffer.readUInt8(currentOffset);

    currentOffset += 1;
    v += (b % 128) * 2 ** (7 * currentByte);
    currentByte += 1;

    if (b < 128) {
      break;
    }
  }

  return {
    offset: currentOffset,
    value: v,
  };
};

const localHeaderTypeBuffer = (type: 'imageSource' | 'miscData' | 'svgContent' | 'thumbnail'): Buffer => {
  switch (type) {
    case 'svgContent':
      return Buffer.from([0x01]);
    case 'imageSource':
      return Buffer.from([0x02]);
    case 'thumbnail':
      return Buffer.from([0x03]);
    case 'miscData':
      return Buffer.from([0x04]);
    default:
      break;
  }

  return Buffer.from([]);
};

// 1 Byte Type (0x01 for svg content) + ? bytes vint length + length bytes svg string
const generateSvgBlockBuffer = (svgString: string) => {
  const typeBuf = localHeaderTypeBuffer('svgContent');
  const svgStringBuf = Buffer.from(svgString);
  const lengthVintBuf = valueToVIntBuffer(svgStringBuf.length);

  return Buffer.concat([typeBuf, lengthVintBuf, svgStringBuf]);
};

// 1 Byte Type (0x02 for svg content) + ? bytes vint length + length bytes svg string
const generateImageSourceBlockBuffer = (imageSources: { [id: string]: ArrayBuffer }) => {
  let imageSourceBlockBuffer = localHeaderTypeBuffer('imageSource');
  let tempbuffer = Buffer.alloc(0);
  const ids = Object.keys(imageSources);

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const idSizeBuf = Buffer.alloc(1);
    const idBuf = Buffer.from(id);

    idSizeBuf.writeUInt8(idBuf.length, 0);

    const imageBuf = Buffer.from(imageSources[id]);
    const imageSizeBuf = valueToVIntBuffer(imageBuf.length);

    tempbuffer = Buffer.concat([tempbuffer, idSizeBuf, idBuf, imageSizeBuf, imageBuf]);
  }
  imageSourceBlockBuffer = Buffer.concat([imageSourceBlockBuffer, valueToVIntBuffer(tempbuffer.length), tempbuffer]);

  return imageSourceBlockBuffer;
};

const generateThumbnailBlockBuffer = (thumbnail: ArrayBuffer): Buffer => {
  let blocBuffer = localHeaderTypeBuffer('thumbnail');
  const imageBuffer = Buffer.from(thumbnail);

  blocBuffer = Buffer.concat([blocBuffer, valueToVIntBuffer(imageBuffer.length), imageBuffer]);

  return blocBuffer;
};

const generateMiscDataBlockBuffer = (data: MiscData): Buffer => {
  const headerBuf = localHeaderTypeBuffer('miscData');
  const contentBuf = Buffer.from(JSON.stringify(data));
  const lengthVintBuf = valueToVIntBuffer(contentBuf.length);

  return Buffer.concat([headerBuf, lengthVintBuf, contentBuf]);
};

const generateBeamBuffer = (
  svgString: string,
  imageSources: { [id: string]: ArrayBuffer },
  thumbnail?: ArrayBuffer,
): Buffer => {
  const signatureBuffer = Buffer.from([66, 101, 97, 109, 2]); // Bvg{version in uint} max to 255
  const svgBlockBuf = generateSvgBlockBuffer(svgString);
  const imageSourceBlockBuffer = generateImageSourceBlockBuffer(imageSources);
  const thumbnailBlockBuffer = thumbnail ? generateThumbnailBlockBuffer(thumbnail) : null;
  const miscData: MiscData = {};

  if (curveEngravingModeController.data) {
    miscData.ce = curveEngravingModeController.data;
  }

  if (hasVariableText()) {
    miscData.vt = useVariableTextState.getState();
  }

  const miscDataBuffer = generateMiscDataBlockBuffer(miscData);
  const metaData = { contents: [1, 2, 3, 4], version: window.FLUX?.version };

  const metaDataBuf = Buffer.from(JSON.stringify(metaData));
  const headerBuffer = Buffer.concat([
    valueToVIntBuffer(metaDataBuf.length),
    metaDataBuf,
    valueToVIntBuffer(svgBlockBuf.length),
    valueToVIntBuffer(imageSourceBlockBuffer.length),
    valueToVIntBuffer(thumbnailBlockBuffer?.length || 0),
    valueToVIntBuffer(miscDataBuffer.length),
  ]);
  const headerSizeBuf = valueToVIntBuffer(headerBuffer.length);
  const buffer = Buffer.concat([
    signatureBuffer,
    headerSizeBuf,
    headerBuffer,
    svgBlockBuf,
    imageSourceBlockBuffer,
    thumbnailBlockBuffer || Buffer.from([]),
    miscDataBuffer,
    Buffer.from([0x00]),
  ]);

  return buffer;
};

const readHeader = (headerBuf: Buffer) => {
  let vInt;
  let offset = 0;

  vInt = readVInt(headerBuf, offset);
  offset = vInt.offset;

  const metadataSize = vInt.value;
  // Can be used to load specific data without read all blocks
  const metaData = headerBuf.toString('utf-8', offset, offset + metadataSize);

  console.log(metaData);
  offset += metadataSize;
  vInt = readVInt(headerBuf, offset);
  offset = vInt.offset;
  // console.log('svgBlockSize', vInt.value);
  vInt = readVInt(headerBuf, offset);
  offset = vInt.offset;

  // console.log('Image Source block Size', vInt.value);
  if (offset < headerBuf.length) {
    vInt = readVInt(headerBuf, offset);
    offset = vInt.offset;
    // console.log('Thumbnail block Size', vInt.value);
  }
};

const readImageSource = (buf: Buffer, offset: number, end: number) => {
  let currentOffset = offset;

  while (currentOffset < end) {
    const idSize = buf.readUInt8(currentOffset);

    currentOffset += 1;

    const id = buf.toString('utf-8', currentOffset, currentOffset + idSize);

    currentOffset += idSize;

    const { offset: newOffset, value: imageSize } = readVInt(buf, currentOffset);

    currentOffset = newOffset;

    const blob = new Blob([buf.subarray(currentOffset, currentOffset + imageSize)]);
    const src = URL.createObjectURL(blob);

    currentOffset += imageSize;

    const image = document.querySelector(`image#${id}`);

    if (image) {
      image.setAttribute('origImage', src);
      image.setAttribute('preserveAspectRatio', 'none');
      updateImageDisplay(image as SVGImageElement, { useNativeSize: true });
    }
  }
};

const readBlocks = async (buf: Buffer, offset: number, command?: IBatchCommand) => {
  if (offset >= buf.length) {
    console.warn('offset exceed buffer length');

    return -1;
  }

  let currentOffset = offset;
  const blockType = buf.readUInt8(currentOffset);

  currentOffset += 1;

  if (blockType === 0) {
    // Ending Block
    currentOffset = -1;
  } else if (blockType === 1) {
    // Svg Content
    console.log('Svg Content Block');

    const { offset: newOffset, value } = readVInt(buf, currentOffset);

    currentOffset = newOffset;
    console.log('Size', value);

    const svgString = buf.toString('utf-8', currentOffset, currentOffset + value);

    await importBvgString(svgString, { parentCmd: command });
    currentOffset += value;
  } else if (blockType === 2) {
    // image source
    console.log('Image Source Block');

    const { offset: newOffset, value } = readVInt(buf, currentOffset);

    currentOffset = newOffset;
    console.log('Size', value);
    readImageSource(buf, currentOffset, currentOffset + value);
    currentOffset += value;
  } else if (blockType === 3) {
    // thumbnail
    console.log('Thumbnail Block');

    const { offset: newOffset, value } = readVInt(buf, currentOffset);

    console.log('Size', value);
    currentOffset = newOffset + value;
  } else if (blockType === 4) {
    // misc data
    console.log('Miscellaneous data');

    const { offset: newOffset, value } = readVInt(buf, currentOffset);

    console.log('Size', value);

    const miscData = buf.toString('utf-8', newOffset, newOffset + value);

    try {
      const data: MiscData = JSON.parse(miscData);

      if (data.ce) {
        console.log(data.ce);
      }

      curveEngravingModeController.loadData(data.ce, { parentCmd: command });

      if (data.vt) {
        useVariableTextState.setState(data.vt);
      }
    } catch (e) {
      console.error('Failed to parse misc data', e);
    }
    currentOffset = newOffset + value;
  } else {
    console.error(`Unknown Block Type: ${blockType}`);
    currentOffset = -1;
  }

  return currentOffset;
};

const readBeam = async (file: File): Promise<void> => {
  const data = await new Promise<ArrayBuffer>((resolve) => {
    const fr = new FileReader();

    fr.onloadend = (evt) => {
      resolve(evt.target.result as ArrayBuffer);
    };
    fr.readAsArrayBuffer(file);
  });
  const buf = Buffer.from(data);

  let offset = 0;
  const signatureBuffer = buf.subarray(offset, 5);

  console.log('Signature:', signatureBuffer.toString());
  offset += 5;

  const version = signatureBuffer.readUInt8(4);

  console.log('Beam Version: ', version);

  const vint = readVInt(buf, offset);
  const headerSize = vint.value;

  offset = vint.offset;

  const headerBuf = buf.subarray(offset, offset + headerSize);

  readHeader(headerBuf);
  offset += headerSize;

  const command = new history.BatchCommand('Load Beam File');

  while (offset > 0) {
    offset = await readBlocks(buf, offset, command);
  }

  const postReadBeam = (): void => {
    workareaManager.setWorkarea(useDocumentStore.getState().workarea);
    workareaManager.resetView();
  };

  command.onAfter = postReadBeam;
  postReadBeam();

  undoManager.addCommandToHistory(command);
  Progress.popById('loading_image');
};

const readBeamFileInfo = async (file: File): Promise<{ thumbnail: string; workarea: null | string }> => {
  const data = await new Promise<ArrayBuffer>((resolve) => {
    const fr = new FileReader();

    fr.onloadend = (evt) => {
      resolve(evt.target!.result as ArrayBuffer);
    };
    fr.readAsArrayBuffer(file);
  });
  const buf = Buffer.from(data);

  // Find data-workarea in the beginning of the file
  const content = buf.subarray(0, 1000).toString('utf-8');
  const workareaString = content.match(/data-workarea="([^"]+)"/);
  const workarea = workareaString ? workareaString[1] : null;
  let blockType = 0;
  let { offset, value: size } = readVInt(buf, 5); // skip signature and metadata

  // Find thumbnail block
  while (offset < buf.length && blockType !== 3) {
    offset += size;
    blockType = buf.readUInt8(offset);
    ({ offset, value: size } = readVInt(buf, offset + 1));
  }

  return {
    thumbnail: blockType === 3 ? `data:image/png;base64,${buf.subarray(offset, offset + size).toString('base64')}` : '',
    workarea,
  };
};

const readBvgFileInfo = async (file: File): Promise<{ thumbnail: string; workarea: null | string }> => {
  const data = await new Promise<ArrayBuffer>((resolve) => {
    const fr = new FileReader();

    fr.onloadend = (evt) => {
      resolve(evt.target!.result as ArrayBuffer);
    };
    fr.readAsArrayBuffer(file);
  });
  const buf = Buffer.from(data);

  // Find data-workarea in the beginning of the file
  const content = buf.toString('utf-8');
  const workareaString = content.match(/data-workarea="([^"]+)"/);
  const workarea = workareaString ? workareaString[1] : null;

  return {
    thumbnail: `data:image/svg+xml; charset=utf8, ${encodeURIComponent(content)}`,
    workarea,
  };
};

export default {
  generateBeamBuffer,
  readBeam,
  readBeamFileInfo,
  readBvgFileInfo,
};
