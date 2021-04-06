import Modal from 'app/widgets/Modal';
import discover from 'helpers/api/discover';
import i18n from 'helpers/i18n';
import { IDeviceInfo } from 'interfaces/IDevice';

const classNames = requireNode('classnames');
const React = requireNode('react');
const { useRef, useEffect, useState } = React;

let _discover = null;

const DeviceSelector = ({ onSelect, onClose }) => {
    const [deviceList, setDeviceList] = useState([]);
    useEffect(() => {
        _discover = discover('device-selector', (discoverdDevices) => {
            discoverdDevices = discoverdDevices.filter((device) => device.serial !== 'XXXXXXXXXX');
            discoverdDevices.sort((deviceA, deviceB) => deviceA.name.localeCompare(deviceB.name));
            setDeviceList(discoverdDevices);
        });
        return () => {
            _discover.removeListener('device-selector');
        }
    }, []);

    let status = i18n.lang.machine_status;
    let list = deviceList.length > 0 ? deviceList.map((device: IDeviceInfo) => {
        let statusText = status[device.st_id] || status.UNKNOWN;
        let img = `img/icon_${device.source === 'h2h' ? 'usb' : 'wifi'}.svg`;
        let progress = '';

        if (16 === device.st_id && 'number' === typeof device.st_prog) {
            progress = (device.st_prog * 100).toFixed(1) + '%';
        }

        return (
            <li
                key={device.uuid}
                name={device.uuid}
                onClick={() => {
                    onSelect(device);
                    onClose();
                }}
                data-test-key={device.serial}
            >
                <label className="name">{device.name}</label>
                <label className="status">{statusText}</label>
                <label className="progress">{progress}</label>
                <label className="connection-type">
                    <div className="type">
                        <img src={img} />
                    </div>
                </label>
            </li>
        );
    }) : (<div key="spinner-roller" className="spinner-roller spinner-roller-reverse" />);

    return (
        <Modal>
            <div className='device-selector'>
                <div className='title'>{i18n.lang.select_device.select_device}</div>
                <div className="device-list">
                    <ul>{list}</ul>
                </div>
                <div className='footer'>
                    <button
                        className='btn btn-default'
                        onClick={() => {
                            onSelect(null);
                            onClose()
                        }}
                    >
                        {i18n.lang.alert.cancel}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default DeviceSelector;
