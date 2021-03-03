const React = requireNode('react');
const classNames = requireNode('classnames');

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import DeviceConstants from 'app/constants/device-constants';
import { ItemType } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/Monitor-Context';
import FileItem from './widgets/File-Item';
import DeviceMaster from 'helpers/device-master';

class MonitorFilelist extends React.Component {
    private willUnmount: boolean = false;
    constructor(props) {
        super(props);
        this.isUSBExist = false;
        this.state = {
            directories: [],
            files: [],
            fileInfos: {},
        };
    }

    async componentDidMount() {
        const { path } = this.props;
        if (path === '') {
            await this.checkUSBFolderExistance();
        }
        await this.getFolderContent();
        await this.getFileInfos();
    }

    async componentDidUpdate(prevProps) {
        const { path } = this.props;
        const { shouldUpdateFileList, setShouldUpdateFileList } = this.context;
        if (path !== prevProps.path || shouldUpdateFileList) {
            if (shouldUpdateFileList) {
                setShouldUpdateFileList(false);
            }
            await this.getFolderContent();
            await this.getFileInfos();
        }
    }

    componentWillUnmount() {
        this.willUnmount = true;
    }

    checkUSBFolderExistance = async () => {
        try {
            const res = await DeviceMaster.ls('USB');
            console.log(res);
            this.isUSBExist = true;
        } catch (error) {
            this.isUSBExist = false;
        }
    }

    async getFolderContent() {
        const { path } = this.props;
        const res = await DeviceMaster.ls(path);
        if(res.error) {
            if(res.error !== DeviceConstants.NOT_EXIST) {
                Alert.popUp({
                    id: 'ls error',
                    type: AlertConstants.SHOW_POPUP_ERROR,
                    message: res.error,
                });
                res.directories = [];
                res.files = [];
            }
        }

        if (!this.isUSBExist && path === '') {
            const i = res.directories.indexOf('USB');
            if(i >= 0) {
                res.directories.splice(i, 1);
            }
        }

        this.setState({
            directories: res.directories,
            files: res.files,
            fileInfos: {},
        });
    }

    async getFileInfos() {
        const { path } = this.props;
        const { files, fileInfos } = this.state;
        for (let i = 0; i < files.length; i++) {
            if (this.willUnmount) {
                return;
            }
            const file = files[i];
            const res = await DeviceMaster.fileInfo(path, file);
            fileInfos[file] = res;
            this.setState({ fileInfos });
        }
    }

    renderFolders() {
        const { directories } = this.state;
        const { onHighlightItem, onSelectFolder, highlightedItem } = this.context;
        const { path } = this.props;
        const folderElements = directories.map((folder: string) => {
            return (
                <div
                    className="folder"
                    key={`${path}/${folder}`}
                    qa-foldername={folder}
                    onClick={() => onHighlightItem({ name: folder, type: ItemType.FOLDER })}
                    onDoubleClick={() => onSelectFolder(folder)}
                >
                    <div className={classNames('name', {'selected': highlightedItem.type === ItemType.FOLDER && highlightedItem.name === folder})}>
                        {folder}
                    </div>
                </div>

            );
        });
        return folderElements;
    }

    renderFiles() {
        const { files, fileInfos } = this.state;
        const { highlightedItem } = this.context;
        const { path } = this.props;

        const fileElements = files.map((file: string) => {
            let imgSrc = 'img/ph_s.png';
            if (fileInfos[file] && fileInfos[file][2] instanceof Blob) {
                imgSrc = URL.createObjectURL(fileInfos[file][2]);
            }
            return (
                <FileItem
                    key={`${path}/${file}`}
                    fileName={file}
                    fileInfo={fileInfos[file]}
                    isSelected={highlightedItem.name === file && highlightedItem.type === ItemType.FILE}
                />
            )
        });
        return fileElements;
    }

    render() {
        return (
            <div className="wrapper">
                {this.renderFolders()}
                {this.renderFiles()}
            </div>
        );
    }
};
MonitorFilelist.contextType = MonitorContext;

export default MonitorFilelist;
