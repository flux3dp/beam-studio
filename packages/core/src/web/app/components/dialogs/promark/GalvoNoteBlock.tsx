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
  '推薦校正順序：【區域】工作範圍 ->【模組】對焦高度 -> 所有 Promark 場鏡參數 -> 【模組】X/Y 偏移',
  '工作範圍會影響算圖時自動套用的 block size。70 mm 工作範圍的預設 block size 待確認。',
  '對焦高度目前只保存，不影響換頭行為／player 自動對焦。',
  '兩組 X/Y 偏移要分開設定：【區域】的是場鏡本身的偏移，影響光路與功率平衡；【模組】的是模組偏移，也就是【校正振鏡模組】中設定的那一組，只在算圖期間生效，不會繼續往下傳給 BSL SDK。通常改完【區域】的偏移後，需要重新校正【模組】的 X/Y 偏移。',
  'Axis 區塊目前只在 dev 模式下顯示。預設 CO2 X/Y Invert 開啟，其餘關閉，若有需要調整預設值／評估需要開放給一般使用者，請再反饋。',
  '預覽、標記、Move、Dot 送出的都是畫面上當下的參數，不需要先儲存 —— 機器會把它們疊在自己存的標定值上。' +
    '這四個也都會自行確認模組頭已串聯，不必先按 Connect。',
  '預覽是紅光迴圈，按「停止」才會結束，期間不能打標。預覽參數只影響預覽；實際標記一律走一圈、用標記速度，' +
    '而且卡片會在下一個操作開始時還原自己的跳躍設定，慢的預覽不會留下慢的標記。',
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
