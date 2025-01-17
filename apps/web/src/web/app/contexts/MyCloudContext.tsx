import React, { createContext, Dispatch, SetStateAction, useEffect, useState } from 'react';

import cloudFile from 'helpers/api/cloudFile';
import { IFile } from 'interfaces/IMyCloud';

interface MyCloudContextType {
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
  files: IFile[] | undefined;
  editingId: string | null;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  selectedId: string | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  onClose: () => void;
  fileOperation: {
    open: (file: IFile) => Promise<void>;
    duplicate: (file: IFile) => Promise<void>;
    download: (file: IFile) => Promise<void>;
    rename: (file: IFile, newName: string) => Promise<void>;
    delete: (file: IFile) => Promise<void>;
  };
}

export const MyCloudContext = createContext<MyCloudContextType>({
  sortBy: 'recent',
  setSortBy: () => {},
  files: [],
  editingId: null,
  setEditingId: () => {},
  selectedId: null,
  setSelectedId: () => {},
  onClose: () => {},
  fileOperation: {
    open: async () => {},
    duplicate: async () => {},
    download: async () => {},
    rename: async () => {},
    delete: async () => {},
  },
});

interface MyCloudProviderProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function MyCloudProvider({ children, onClose }: MyCloudProviderProps): JSX.Element {
  const [sortBy, setSortBy] = useState('recent');
  const [files, setFiles] = useState<IFile[] | undefined>(undefined);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const sortAndSetFiles = (newFiles: IFile[] = files) => {
    if (!newFiles) return;
    newFiles.sort((a: IFile, b: IFile) => {
      if (sortBy === 'old') {
        if (a.last_modified_at < b.last_modified_at) return -1;
        if (a.last_modified_at > b.last_modified_at) return 1;
        return 0;
      }
      if (sortBy === 'a2z') {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      }
      if (sortBy === 'z2a') {
        if (a.name > b.name) return -1;
        if (a.name < b.name) return 1;
        return 0;
      }
      // sortBy === 'recent'
      if (a.last_modified_at > b.last_modified_at) return -1;
      if (a.last_modified_at < b.last_modified_at) return 1;
      return 0;
    });
    setFiles([...newFiles]);
  };

  const getFileList = async (): Promise<IFile[]> => {
    const { data, shouldCloseModal } = await cloudFile.list();
    if (shouldCloseModal) {
      onClose();
      return [];
    }
    return data;
  };

  const refresh = async () => {
    const newFiles = await getFileList();
    sortAndSetFiles(newFiles);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sortAndSetFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const openFile = async (file: IFile) => {
    const { shouldCloseModal } = await cloudFile.openFile(file);
    if (shouldCloseModal) onClose();
  };

  const duplicateFile = async (file: IFile) => {
    const { res, data, shouldCloseModal } = await cloudFile.duplicateFile(file.uuid);
    if (shouldCloseModal) {
      onClose();
      return;
    }
    refresh();
    if (res && data?.new_file) {
      const newFile = data?.new_file;
      setSelectedId(newFile);
      setEditingId(newFile);
    }
  };

  const renameFile = async (file: IFile, newName: string) => {
    if (newName && file.name !== newName) {
      const { res, shouldCloseModal } = await cloudFile.renameFile(file.uuid, newName);
      if (shouldCloseModal) {
        onClose();
        return;
      }
      if (res) {
        // eslint-disable-next-line no-param-reassign
        file.name = newName;
        sortAndSetFiles();
      }
    }
    setEditingId(null);
  };

  const deleteFile = async (file: IFile) => {
    const { shouldCloseModal } = await cloudFile.deleteFile(file.uuid);
    if (shouldCloseModal) {
      onClose();
      return;
    }
    refresh();
  };

  return (
    <MyCloudContext.Provider
      value={{
        sortBy,
        setSortBy,
        files,
        editingId,
        setEditingId,
        selectedId,
        setSelectedId,
        onClose,
        fileOperation: {
          open: openFile,
          duplicate: duplicateFile,
          download: cloudFile.downloadFile,
          rename: renameFile,
          delete: deleteFile,
        },
      }}
    >
      {children}
    </MyCloudContext.Provider>
  );
}
