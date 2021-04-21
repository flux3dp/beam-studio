import MonitorActionCreator from './monitor';
import MonitorActionType from '../constants/action-creator-monitor';
import GlobalConstant from '../constants/global-constants';

describe('test monitor action creator', () => {
    test('changeMode', () => {
        const result = MonitorActionCreator.changeMode('PRINT');
        expect(result).toEqual({
            type: MonitorActionType.CHANGE_MODE,
            mode: 'PRINT',
        });
    });

    test('changePath', () => {
        const result = MonitorActionCreator.changePath('this is path', 'this is content');
        expect(result).toEqual({
            type: MonitorActionType.CHANGE_PATH,
            mode: GlobalConstant.FILE,
            path: 'this is path',
            folderContent: 'this is content',
            isWaiting: false,
        });
    });

    test('updateFoldercontent', () => {
        const result = MonitorActionCreator.updateFoldercontent('this is content');
        expect(result).toEqual({
            type: MonitorActionType.UPDATE_FOLDER_CONTENT,
            mode: GlobalConstant.FILE,
            folderContent: 'this is content',
            isWaiting: false,
        });
    });

    test('previewFile', () => {
        const result = MonitorActionCreator.previewFile('this is info');
        expect(result).toEqual({
            type: MonitorActionType.PREVIEW_FILE,
            mode: GlobalConstant.FILE_PREVIEW,
            selectedFileInfo: 'this is info',
        });
    });

    test('selectItem', () => {
        const result = MonitorActionCreator.selectItem({ name: 'abc', type: 'xyz' });
        expect(result).toEqual({
            type: MonitorActionType.SELECT_ITEM,
            selectedItem: { name: 'abc', type: 'xyz' },
        });
    });

    test('setDownloadProgress', () => {
        const result = MonitorActionCreator.setDownloadProgress({ size: '100mb', left: '50mb' });
        expect(result).toEqual({
            type: MonitorActionType.SET_DOWNLOAD_PROGRESS,
            downloadProgress: { size: '100mb', left: '50mb' },
        });
    });

    test('setUploadProgress', () => {
        const result = MonitorActionCreator.setUploadProgress({ size: '100mb', left: '50mb' });
        expect(result).toEqual({
            type: MonitorActionType.SET_UPLOAD_PROGRESS,
            uploadProgress: { size: '100mb', left: '50mb' },
        });
    });

    test('showWait', () => {
        const result = MonitorActionCreator.showWait();
        expect(result).toEqual({
            type: MonitorActionType.SHOW_WAIT,
            isWaiting: true,
        });
    });

    test('closeWait', () => {
        const result = MonitorActionCreator.closeWait();
        expect(result).toEqual({
            type: MonitorActionType.CLOSE_WAIT,
            isWaiting: false,
        });
    });

    test('setCameraOffset', () => {
        const result = MonitorActionCreator.setCameraOffset({
            x: 20,
            y: 30,
            angle: 0,
            scaleRatioX: 1.625,
            scaleRatioY: 1.625,
        });
        expect(result).toEqual({
            type: MonitorActionType.SET_CAMERA_OFFSET,
            cameraOffset: {
                x: 20,
                y: 30,
                angle: 0,
                scaleRatioX: 1.625,
                scaleRatioY: 1.625,
            },
        });
    });

    test('setMaintainMoving', () => {
        const result = MonitorActionCreator.setMaintainMoving();
        expect(result).toEqual({
            type: MonitorActionType.SET_MAINTAIN_MOVING,
            isMaintainMoving: true,
        });
    });

    test('setCurrentPosition', () => {
        const result = MonitorActionCreator.setCurrentPosition({
            x: 0,
            y: 0,
        });
        expect(result).toEqual({
            type: MonitorActionType.SET_CURRENT_POSITION,
            isMaintainMoving: false,
            currentPosition: {
                x: 0,
                y: 0,
            },
        });
    });

    test('setRelocateOrigin', () => {
        const result = MonitorActionCreator.setRelocateOrigin({
            x: 0,
            y: 0,
        });
        expect(result).toEqual({
            type: MonitorActionType.SET_RELOCATE_ORIGIN,
            relocateOrigin: {
                x: 0,
                y: 0,
            },
        });
    });
});
