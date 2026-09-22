import React from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';

import blockStyles from './Block.module.scss';
import styles from './GalvoNoteBlock.module.scss';

/**
 * What is and is not wired up yet, for whoever is testing a machine on the factory floor.
 *
 * TODO: dev only, hence untranslated. Delete the entries as they stop being true rather than
 * letting the list drift -- a stale note here is worse than no note.
 */
const notes = [
  '工作範圍會影響算圖時自動套用的 block size。70 mm 工作範圍的預設 block size 待確認。',
  '對焦高度目前只保存，不影響換頭行為／player 自動對焦。',
  'X/Y 偏移就是【校正振鏡模組】中設定的模組偏移。只在算圖期間生效，不會繼續往下傳給 BSL SDK。',
  'Axis 區塊目前只在 dev 模式下顯示。預設 CO2 X/Y Invert 開啟，其餘關閉，若有需要調整預設值／評估需要開放給一般使用者，請再反饋。',
  '串聯／預覽／標記按鈕目前不生效，請先直接用送出普通工作的方式處理。',
];

const GalvoNoteBlock = (): React.JSX.Element => (
  <Flex className={classNames(blockStyles.block, blockStyles['full-row'])} gap={8} vertical>
    <div className={blockStyles.title}>Notes (dev)</div>
    <ol className={styles.notes}>
      {notes.map((note) => (
        <li key={note}>{note}</li>
      ))}
    </ol>
  </Flex>
);

export default GalvoNoteBlock;
