import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const LANG = i18n.lang.change_logs;

const CHANGES_TW = {
  added: [
  ],
  fixed: [
    '修正 開啟儀表板狀態下與機器斷線，彈出多個無法連線視窗的問題。',
    '修正 偏好設定內，「自動更新」功能。',
  ],
  changed: [
  ],
};

const CHANGES_EN = {
  added: [
  ],
  fixed: [
    'Fixed the problem that multiple dialogs pop out when Beam Studio loses connection with the machine when opening the "Dashboard."',
    'Fixed the “Auto Update" setting in the Preference.',
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
