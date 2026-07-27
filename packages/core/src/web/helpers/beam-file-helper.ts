// 【TODO：add tests】high-risk binary (de)serializer, currently untested. Cover:
// - round-trip block 0x05: generateThumbnailsListBlockBuffer → readBlocks restores key/isVisible/data
// - metadata.template flag round-trips through generateBeamBuffer / readHeader / readBeam
// - readBeamFileInfo: templateOnly bails on non-template; getThumbnails stops at first 0x03 vs scans 0x05
// - truncated buffer throws BeamFileFormatError (readable) instead of RangeError, unknown block type stops the loop
// - multibyte thumbnail keys survive the UTF-8 byte-length offsets
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
  |    Metadata    | ↖            | string                                          |
   ---------------------------------------------------------------------------------
  | svg content Len |    VINT     | indicate size of svg content block              |
   ---------------------------------------------------------------------------------
  | image source Len |     VINT   | indicate size of image source block             |
   ---------------------------------------------------------------------------------
  |  Thumbnail Len |      VINT    | indicate size of Thumbnail block                |
    --------------------------------------------------------------------------------
  |  Misc Data Len |      VINT    | indicate size of Misc Data block                |
    ---------------------------------------------------------------------------------
  | Custom Thumbnail Len |  VINT  | indicate size of Custom Thumbnail block         |
    --------------------------------------------------------------------------------

    Blocks:

   =================================================================================
  |   Svg Content  |  content len |         Block Containing Svg contents           |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Byte    | 0x01 for svg content                            |
   ---------------------------------------------------------------------------------
  |  string length |     VINT     | indicate size of svg string                     |
   ---------------------------------------------------------------------------------
  |   svg string   | ↖            | string                                          |
   ---------------------------------------------------------------------------------

   =================================================================================
  |  Image Source  |      ...     |         Block Containing Image Source           |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Byte    | 0x02 for svg content                            |
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
  |   block type   |    1 Byte    | 0x03 for Thumbnail                              |
   ---------------------------------------------------------------------------------
  |      size      |     VINT     | indicate size of image                          |
   ---------------------------------------------------------------------------------
  |      Image     | ↖            | Image binary of thumbnail (jpeg)                |
   ---------------------------------------------------------------------------------

   =================================================================================
  | MISC DATA(JSON)|  content len |    Block Containing json string of Misc. Data   |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Byte    | 0x04                                            |
   ---------------------------------------------------------------------------------
  |      size      |     VINT     | indicate size of json string                    |
   ---------------------------------------------------------------------------------
  |    content     | ↖            | json string of misc data                        |
   ---------------------------------------------------------------------------------

   =================================================================================
  |Thumbnail Source|  content len | Block Containing Custom Thumbnail Images Source |
   =================================================================================
   ---------------------------------------------------------------------------------
  |   block type   |    1 Byte    | 0x05                                            |
   ---------------------------------------------------------------------------------
  |     length     |     VINT     | indicate size of remaining block                |
   ---------------------------------------------------------------------------------
  |      count     |     VINT     | indicate number of images in the block          |
   ---------------------------------------------------------------------------------
  | Image Key Len  |     VINT     | Len of image key                                |
   ---------------------------------------------------------------------------------
  |   Image Key    | ↖            | Image Key                                       |
   ---------------------------------------------------------------------------------
  |  visible flag  |    1 Byte    | indicate if the image is visible                |
   ---------------------------------------------------------------------------------
  |    Image Len   |     VINT     | Len of image                                    |
   ---------------------------------------------------------------------------------
  |      Image     | ↖            | Image Source                                    |
   ---------------------------------------------------------------------------------
  |        Repeat Image Key Len, Image Key, Visible Flag, Image Len, Image          |
   ---------------------------------------------------------------------------------

*/
import { Buffer } from 'buffer';

import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Progress from '@core/app/actions/progress-caller';
import type { ExportThumbnail } from '@core/app/components/FileThumbnail/getThumbnailsForExport';
import { addThumbnail } from '@core/app/components/FileThumbnail/utils';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { useVariableTextState, type VariableTextState } from '@core/app/stores/variableText';
import currentFileManager from '@core/app/svgedit/currentFileManager';
import history from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { importBvgString } from '@core/app/svgedit/operations/import/importBvg';
import workareaManager from '@core/app/svgedit/workarea';
import { bufferToBlob } from '@core/helpers/data-url-utils';
import updateImageDisplay from '@core/helpers/image/updateImageDisplay';
import { hasVariableText } from '@core/helpers/variableText';
import type { CurveEngraving } from '@core/interfaces/ICurveEngraving';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type { IFileThumbnail } from '@core/interfaces/IMyCloud';

interface MetaData {
  contents: number[];
  template: boolean;
  version: string;
}

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

/**
 * Thrown when a .beam buffer is truncated / malformed. Beam files can come from anywhere
 * (mail attachments, USB sticks, older or corrupted exports), so parsing must fail with a
 * readable message instead of a bare `RangeError [ERR_OUT_OF_RANGE]` from Buffer.
 */
export class BeamFileFormatError extends Error {
  constructor(message: string) {
    super(`Corrupted .beam file: ${message}`);
    this.name = 'BeamFileFormatError';
  }
}

/** Assert `length` bytes are readable at `offset` without running past `end`. */
const assertRange = (buf: Buffer, offset: number, length: number, what: string, end: number = buf.length): void => {
  const limit = Math.min(end, buf.length);

  if (offset < 0 || length < 0 || offset + length > limit) {
    throw new BeamFileFormatError(
      `${what} needs ${length} byte(s) at offset ${offset}, but only ${Math.max(0, limit - offset)} available`,
    );
  }
};

const readVInt = (buffer: Buffer, offset = 0, end: number = buffer.length, what = 'VINT') => {
  let v = 0;
  let currentByte = 0;
  let currentOffset = offset;
  const limit = Math.min(end, buffer.length);

  while (true) {
    if (currentOffset >= limit) {
      throw new BeamFileFormatError(`${what} runs past the end of the buffer at offset ${currentOffset}`);
    }

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

const localHeaderTypeBuffer = (
  type: 'imageSource' | 'miscData' | 'svgContent' | 'thumbnail' | 'thumbnailsList',
): Buffer => {
  switch (type) {
    case 'svgContent':
      return Buffer.from([0x01]);
    case 'imageSource':
      return Buffer.from([0x02]);
    case 'thumbnail':
      return Buffer.from([0x03]);
    case 'miscData':
      return Buffer.from([0x04]);
    case 'thumbnailsList':
      return Buffer.from([0x05]);
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

const generateThumbnailsListBlockBuffer = (thumbnails: ExportThumbnail[]): Buffer => {
  const typeBuf = localHeaderTypeBuffer('thumbnailsList');
  // Collect every piece first and concat once: concatenating inside the loop copies the whole
  // accumulated buffer per thumbnail (O(n²) over the image bytes, not just the entry count).
  const parts: Buffer[] = [valueToVIntBuffer(thumbnails.length)];

  for (const { data, isVisible, key } of thumbnails) {
    const keyBuf = Buffer.from(key);
    const dataBuf = data ? Buffer.from(data) : Buffer.from([]);

    parts.push(
      valueToVIntBuffer(keyBuf.length),
      keyBuf,
      Buffer.from([isVisible ? 1 : 0]),
      valueToVIntBuffer(dataBuf.length),
      dataBuf,
    );
  }

  const contentBuf = Buffer.concat(parts);

  return Buffer.concat([typeBuf, valueToVIntBuffer(contentBuf.length), contentBuf]);
};

const generateBeamBuffer = (
  svgString: string,
  imageSources: { [id: string]: ArrayBuffer },
  thumbnail?: ArrayBuffer,
  thumbnailsList?: ExportThumbnail[],
  isTemplateFile = !!currentFileManager.templateFileBlob,
): Buffer => {
  // Bvg{version in uint} max to 255.
  // Version stays 2 even though block 0x05 (thumbnails list) and the `template` metadata flag were
  // added later, because both degrade gracefully on older Beam Studio builds:
  // - 0x05 is always written LAST, right before the 0x00 terminator, so an old reader that hits the
  //   unknown block type aborts the block loop after every block it understands has been consumed
  //   (see the `Unknown Block Type` branch in readBlocks). The file still opens; only the custom
  //   thumbnails are dropped.
  // - its header length VINT is likewise appended after the four known ones, so old readers that
  //   read a fixed number of VINTs are unaffected.
  // - unknown metadata keys (`template`) are ignored by JSON.parse consumers.
  // Bump the version only if a future change breaks one of those properties.
  const signatureBuffer = Buffer.from([66, 101, 97, 109, 2]);
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
  const thumbnailsListBuffer =
    thumbnailsList && thumbnailsList.length > 0 ? generateThumbnailsListBlockBuffer(thumbnailsList) : null;
  const contents = [1, 2, 3, 4];

  if (thumbnailsListBuffer) contents.push(5);

  const metaData: MetaData = { contents, template: isTemplateFile, version: window.FLUX?.version };
  const metaDataBuf = Buffer.from(JSON.stringify(metaData));
  const headerBuffer = Buffer.concat([
    valueToVIntBuffer(metaDataBuf.length),
    metaDataBuf,
    valueToVIntBuffer(svgBlockBuf.length),
    valueToVIntBuffer(imageSourceBlockBuffer.length),
    valueToVIntBuffer(thumbnailBlockBuffer?.length || 0),
    valueToVIntBuffer(miscDataBuffer.length),
    ...(thumbnailsListBuffer ? [valueToVIntBuffer(thumbnailsListBuffer.length)] : []),
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
    ...(thumbnailsListBuffer ? [thumbnailsListBuffer] : []),
    Buffer.from([0x00]),
  ]);

  return buffer;
};

const readHeader = (headerBuf: Buffer): Partial<MetaData> => {
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

  try {
    return JSON.parse(metaData) as Partial<MetaData>;
  } catch (_) {
    return {};
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

interface ThumbnailsListEntry {
  blob: Blob | null;
  isVisible: boolean;
  key: string;
}

/**
 * Read the body of a thumbnails list block (0x05), i.e. everything after its type byte and
 * length VINT. `contentOffset` points at the entry count, `totalSize` is the declared body size.
 *
 * Shared by readBlocks and readBeamFileInfo so the bounds checks can't drift between the two.
 * Every read is bounded by the declared block end: a truncated or lying length yields a
 * BeamFileFormatError instead of a RangeError or a wildly out-of-range slice.
 */
const readThumbnailsListBlock = (
  buf: Buffer,
  contentOffset: number,
  totalSize: number,
): { blockEnd: number; entries: ThumbnailsListEntry[] } => {
  assertRange(buf, contentOffset, totalSize, 'thumbnails list block');

  const blockEnd = contentOffset + totalSize;
  const entries: ThumbnailsListEntry[] = [];
  const { offset: countOffset, value: count } = readVInt(buf, contentOffset, blockEnd, 'thumbnails list count');
  let currentOffset = countOffset;

  for (let i = 0; i < count && currentOffset < blockEnd; i += 1) {
    const { offset: keyLenOffset, value: keyLen } = readVInt(buf, currentOffset, blockEnd, `thumbnail ${i} key size`);

    currentOffset = keyLenOffset;
    assertRange(buf, currentOffset, keyLen, `thumbnail ${i} key`, blockEnd);

    const key = buf.toString('utf-8', currentOffset, currentOffset + keyLen);

    currentOffset += keyLen;
    assertRange(buf, currentOffset, 1, `thumbnail ${i} visible flag`, blockEnd);

    const isVisible = buf.readUInt8(currentOffset) === 1;

    currentOffset += 1;

    const { offset: srcLenOffset, value: srcLen } = readVInt(buf, currentOffset, blockEnd, `thumbnail ${i} data size`);

    currentOffset = srcLenOffset;
    assertRange(buf, currentOffset, srcLen, `thumbnail ${i} data`, blockEnd);
    entries.push({ blob: srcLen > 0 ? bufferToBlob(buf, currentOffset, srcLen) : null, isVisible, key });
    currentOffset += srcLen;
  }

  return { blockEnd, entries };
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

    await importBvgString(svgString, { clearTemplateMode: false, parentCmd: command });
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
  } else if (blockType === 5) {
    // thumbnails list
    const { offset: sizeOffset, value: totalSize } = readVInt(buf, currentOffset, buf.length, 'thumbnails list size');
    const { blockEnd, entries } = readThumbnailsListBlock(buf, sizeOffset, totalSize);

    entries.forEach(({ blob, isVisible, key }) => addThumbnail(blob, { isVisible, key }));
    currentOffset = blockEnd;
  } else {
    console.error(`Unknown Block Type: ${blockType}`);
    currentOffset = -1;
  }

  return currentOffset;
};

const readBeam = async (file: File): Promise<void> => {
  const data = await new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();

    fr.onloadend = (evt) => {
      resolve(evt.target?.result as ArrayBuffer);
    };
    fr.onerror = () => reject(fr.error ?? new Error('Failed to read beam file'));
    fr.readAsArrayBuffer(file);
  });

  // Wrap the parsing in try/finally so a malformed / truncated buffer that throws while decoding
  // blocks can never leave the 'loading_image' progress overlay stuck on screen. The error still
  // propagates so callers (import flow, resetTemplate, template-preview receiver) can react.
  try {
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

    const metadata = readHeader(headerBuf);
    const isTemplate = !!metadata.template;

    currentFileManager.setTemplateFile(isTemplate ? file.slice() : null, isTemplate);

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
  } finally {
    Progress.popById('loading_image');
  }
};

const readBeamFileInfo = async (
  file: File,
  { getThumbnails = false, templateOnly = false }: { getThumbnails?: boolean; templateOnly?: boolean } = {},
): Promise<{ thumbnail: string; thumbnails: IFileThumbnail[]; workarea: null | string }> => {
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
  let { offset, value: size } = readVInt(buf, 5);
  let thumbnail = '';
  const fileThumbnails: IFileThumbnail[] = [];

  if (templateOnly) {
    const headerBuf = buf.subarray(offset, offset + size);
    const metaData = readHeader(headerBuf);

    if (!metaData.template) {
      return { thumbnail: '', thumbnails: [], workarea };
    }
  }

  // Scan all blocks for thumbnail (0x03) and thumbnails list (0x05)
  while (offset < buf.length) {
    offset += size;

    if (offset >= buf.length) break;

    blockType = buf.readUInt8(offset);

    // Block type 0 is the terminator
    if (blockType === 0) break;

    ({ offset, value: size } = readVInt(buf, offset + 1));

    if (blockType === 3 && !thumbnail) {
      const blob = bufferToBlob(buf, offset, size);

      thumbnail = URL.createObjectURL(blob);

      if (!getThumbnails) break;
    } else if (blockType === 5) {
      const { entries } = readThumbnailsListBlock(buf, offset, size);

      entries.forEach(({ blob, isVisible, key }) =>
        fileThumbnails.push({ isVisible, key, src: blob ? URL.createObjectURL(blob) : '' }),
      );
    }
  }

  return { thumbnail, thumbnails: fileThumbnails, workarea };
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
