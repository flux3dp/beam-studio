import { IChangeLog } from 'interfaces/IChangeLog';

const CHANGES_TW = {
  added: [
    '提升「銳化」功能，高品質照片雕刻，讓照片更細緻與立體感。',
    '新增 「偏好設定」說明指引連結。',
    '新增 為 Beam Studio 評分功能',
    '在相機校正面板新增"匯入前次校正數值" 以使用上次相機校正結果。',
    '新增「重製」項目在右鍵選單。',
    '說明選單下在 新增 「使用 Beam Studio API」項目。',
    '新增 對焦尺檔案於選單=>檔案=>範例內。',
    '新增「刪除」項目於 選單=>編輯內。',
    '新增「反鋸齒」項目於偏好設定與選單=>顯示內。',
  ],
  fixed: [
    '修正 從 Beam Studio 輸出 SVG 再匯入後，尺寸不一致的問題。',
    '提升匯入 SVG 檔案的速度。',
    '提升「解散圖檔」的速度。',
    '修正 偏好設定內「參考線座標」介面跑版問題。',
    '修正 新增文字框後在畫布上雙擊造成軟體無回應的問題。',
    '修正 部分 SVG 無法匯入的問題。',
    '修正 工作完成或終止後，儀表板無法返為到主頁的問題。',
    '修正 重置後，軟體跳出無意義視窗問題。',
    '修正 圖片取消漸層回到上一步的功能。',
    '修正 拖曳銳化功能拉桿造成軟體異常顯示問題。',
    '修正 使用「生成斜角」功能後出現不存在原圖的線段問題。',
    '修正 使用曲線功能時，點擊曲線兩下，線條會不見。',
    '進入偏好設定後中斷新手教學流程。',
    '修正 某些情況下旋轉數值顯示錯誤的問題。',
    '修正 路徑物件禁止使用裁減與銳化功能的規則。',
    '修正 關閉軟體更新提醒功能失效。',
    '修正 解散圖檔後圖形尺寸顯示錯誤。',
  ],
  changed: [
    '移除偏好設定內「文字路徑計算優化」設定，並且預設開啟。',
    '更改物件群組後圖層歸屬邏輯。\n- 當選取物件圖層一致時，群組後的新物件會在原圖層。\n- 當選取物件圖層不一致時，群組後的新物件會建立在選取物件中的最上層。',
  ],
};

const CHANGES_EN = {
  added: [
    'Enhance the "Sharpen" function. High-quality photo engraving and make photos engrave result more detailed.',
    'Added "Know More" icon links in the "Preference" settings.',
    'Added "Rate for Beam Studio" function.',
    'Added "Use Last Calibration Value" for using last time calibration results in Camera Calibration panel.',
    'Added "Duplicate" item in right-click menu.',
    'Added "Using Beam Studio API" item in the Help menu.',
    'Added Focus Probe file in the Menu => File => Examples.',
    'Added "Delete" item in the Menu => Edit.',
    'Added "Anti-Aliasing" in Preference and the Menu=>Display.',
  ],
  fixed: [
    'Fixed the SVG import size is different if it\'s exported from Beam Studio.',
    'Increase the speed of import the SVG file.',
    'Increase the speed of the "Disassemble" function.',
    'Fixed the "Guides Origin" wrong user interface display in Preference.',
    'Fixed the problem that software no response if double-clicks on the canvas after added the text box.',
    'Fixed some SVG file import failed.',
    'Fixed the Dashboard problem can not back to the main page after laser work is completed or stopped.',
    'Fixed the meaningless dialog pop-up after reset the Beam Studio.',
    'Fixed the undo function for the gradient function.',
    'Fixed the software abnormal display while dragging the "Sharpen" function\'s slider.',
    'Fixed the not exist line after using the "Bevel" function.',
    'Fixed the problem that Double-clicks while drawing path. The path will disappear.',
    'Aborting the "Starting Tutorial" when the entrance to the Preference.',
    'Fixed some operations caused the rotate value display failed problem.',
    'Fixed the rule of the "Crop" and "Sharpen" functions that do not support path objects.',
    'Fixed failed to close the software update reminder function.',
    'Fixed the wrong value display after the Disassemble object.',
  ],
  changed: [
    'Removed the "Text Path Calculation  Optimization" function in the Preference settings and enabled it by default.',
    'Changed the object\'s layer changing rules after grouping.\n- When the selected objects are in the same layer, it won\'t change the layer after grouping.\n- When the selected objects are not in the same layer, it will change the grouping object\'s layer to the top layer which selected.',
  ],
};

export default {
  CHANGES_TW,
  CHANGES_EN,
} as IChangeLog;
