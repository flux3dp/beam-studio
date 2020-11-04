import { IFileFilter } from '../../interfaces/IElectron'
import * as i18n from '../../helpers/i18n';

const electronRemote = requireNode('electron').remote;
const { dialog } = electronRemote;

export default{
    saveFileDialog: async (title: string, filename: string, filters: IFileFilter[], isAllfileAvailable?: boolean) => {
        const isMac = (process.platform === 'darwin');
        const langFile = i18n.lang.topmenu.file;
        filters = filters.map((filter) => {
            const { extensionName, extensions } = filter;
            return {name: isMac ? `${extensionName} (*.${extensions[0]})` : extensionName, extensions: extensions};
        });
        if (isAllfileAvailable) {
            filters.push({ name: langFile.all_files, extensions: ['*'] });
        }
        const options = {
            defaultPath: filename,
            title,
            filters
        };
        const { filePath, canceled } = await dialog.showSaveDialog(options);
        if (canceled) {
            return null;
        }
        return filePath;
    },
    showOpenDialog: async (option) => {
        if (!option) {
            option = {
                properties: ['openFile'],
                filters: [
                    { name: 'All Files', extensions: ['*']},
                ]
            };
        }
        if (!option.properties) {
            option.properties = ['openFile'];
        }
        const res = await dialog.showOpenDialog(option);
        return res;
    }
}