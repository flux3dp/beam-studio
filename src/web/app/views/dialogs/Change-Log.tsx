import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const LANG = i18n.lang.change_logs;

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正 文字框在未輸入文字的狀態下，點擊空白處造成軟體當機的問題。',
    '修正 某些情況下旋轉數值顯示錯誤，導致物件錯位的問題。',
    '修正 使用曲線功能時，點擊曲線兩下，線條會不見。',
    '修正 解散圖檔後圖形尺寸顯示錯誤。',
    '修正 圖片取消漸層無法回到上一步的功能。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed an issue where the software freezes when clicking on the blank space in the text box with no text was entered.',
    'Fixed some operations caused the rotate value display to fail, also cause the object to move to the wrong position problem.',
    'Fixed the problem that Double-clicks while drawing path. The path will disappear.',
    'Fixed the wrong value display after the Disassemble object.',
    'Fixed the undo function for the gradient function.',
  ],
  changed: [
  ],
};

class ChangeLogDialog extends React.Component {
  render(): Element {
    const renderChangeLogs = () => {
      const activeLang = i18n.getActiveLang();
      const CHANGES = activeLang.startsWith('zh') ? CHANGES_TW : CHANGES_EN;
      const logs = [];
      if (CHANGES.added.length > 0) {
        logs.push(<div className="change-log-category" key="added">{LANG.added}</div>);
        for (let i = 0; i < CHANGES.added.length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`added-${i}`}>
              <div className="index">{`${i + 1}.`}</div>
              <div className="log">{CHANGES.added[i]}</div>
            </div>,
          );
        }
      }
      if (CHANGES.fixed.length > 0) {
        logs.push(<div className="change-log-category" key="fixed">{LANG.fixed}</div>);
        for (let i = 0; i < CHANGES.fixed.length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`fixed-${i}`}>
              <div className="index">{`${i + 1}.`}</div>
              <div className="log">{CHANGES.fixed[i]}</div>
            </div>,
          );
        }
      }
      if (CHANGES.changed.length > 0) {
        logs.push(<div className="change-log-category" key="changed">{LANG.changed}</div>);
        for (let i = 0; i < CHANGES.changed.length; i += 1) {
          logs.push(
            <div className="change-log-item" key={`changed-${i}`}>
              <div className="index">{`${i + 1}.`}</div>
              <div className="log">{CHANGES.changed[i]}</div>
            </div>,
          );
        }
      }
      return logs;
    };

    const { onClose } = this.props;
    const { version } = window.electron;
    const changeLogs = renderChangeLogs();
    if (changeLogs.length === 0) {
      onClose();
      return null;
    }

    const handleLink = () => {
      const electron = requireNode('electron');
      electron.remote.shell.openExternal(LANG.help_center_url);
    };

    return (
      <Modal>
        <div className="change-log-dialog">
          <div className="header">
            <img src="icon.png" alt="Beam Studio Logo" />
            <div className="app">{`Beam Studio ${version.replace('-', ' ')}`}</div>
          </div>
          <div className="title">{LANG.change_log}</div>
          <div className="change-log-container">
            {changeLogs}
          </div>
          <div
            role="button"
            tabIndex={0}
            className="link"
            onKeyDown={() => handleLink()}
            onClick={() => handleLink()}
          >
            {LANG.see_older_version}
          </div>
          <div className="footer">
            <button
              type="button"
              className="btn btn-default primary"
              onClick={() => onClose()}
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

ChangeLogDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ChangeLogDialog;
