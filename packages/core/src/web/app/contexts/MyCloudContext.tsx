/* eslint-disable reactRefresh/only-export-components */
import type { Dispatch, SetStateAction } from 'react';
import React, { createContext, useEffect, useState } from 'react';

import cloudFile from '@core/helpers/api/cloudFile';
import type { IFile } from '@core/interfaces/IMyCloud';

interface MyCloudContextType {
  editingId: null | string;
  fileOperation: {
    delete: (file: IFile) => Promise<void>;
    download: (file: IFile) => Promise<void>;
    duplicate: (file: IFile) => Promise<void>;
    open: (file: IFile) => Promise<void>;
    rename: (file: IFile, newName: string) => Promise<void>;
  };
  files: IFile[] | undefined;
  onClose: () => void;
  selectedId: null | string;
  setEditingId: Dispatch<SetStateAction<null | string>>;
  setSelectedId: Dispatch<SetStateAction<null | string>>;
  setSortBy: Dispatch<SetStateAction<string>>;
  sortBy: string;
}

export const MyCloudContext = createContext<MyCloudContextType>({
  editingId: null,
  fileOperation: {
    delete: async () => {},
    download: async () => {},
    duplicate: async () => {},
    open: async () => {},
    rename: async () => {},
  },
  files: [],
  onClose: () => {},
  selectedId: null,
  setEditingId: () => {},
  setSelectedId: () => {},
  setSortBy: () => {},
  sortBy: 'recent',
});

interface MyCloudProviderProps {
  children: React.ReactNode;
  fromWelcomePage?: boolean;
  onClose: () => void;
}

export function MyCloudProvider({
  children,
  fromWelcomePage = false,
  onClose,
}: MyCloudProviderProps): React.JSX.Element {
  const [sortBy, setSortBy] = useState('recent');
  const [files, setFiles] = useState<IFile[] | undefined>(undefined);
  const [editingId, setEditingId] = useState<null | string>(null);
  const [selectedId, setSelectedId] = useState<null | string>(null);

  const sortAndSetFiles = (newFiles: IFile[] | undefined = files) => {
    if (!newFiles) {
      return;
    }

    newFiles.sort((a: IFile, b: IFile) => {
      if (sortBy === 'old') {
        if (a.last_modified_at < b.last_modified_at) {
          return -1;
        }

        if (a.last_modified_at > b.last_modified_at) {
          return 1;
        }

        return 0;
      }

      if (sortBy === 'a2z') {
        if (a.name < b.name) {
          return -1;
        }

        if (a.name > b.name) {
          return 1;
        }

        return 0;
      }

      if (sortBy === 'z2a') {
        if (a.name > b.name) {
          return -1;
        }

        if (a.name < b.name) {
          return 1;
        }

        return 0;
      }

      // sortBy === 'recent'
      if (a.last_modified_at > b.last_modified_at) {
        return -1;
      }

      if (a.last_modified_at < b.last_modified_at) {
        return 1;
      }

      return 0;
    });
    setFiles([...newFiles]);
  };

  const getFileList = async (): Promise<IFile[] | undefined> => {
    const { data, shouldCloseModal } = await cloudFile.list();

    if (shouldCloseModal) {
      onClose();

      return [];
    }

    return data ?? undefined;
  };

  const refresh = async () => {
    const newFiles = await getFileList();

    sortAndSetFiles(newFiles);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sortAndSetFiles();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [sortBy]);

  const openFile = async (file: IFile) => {
    const { shouldCloseModal } = await (fromWelcomePage ? cloudFile.openFileInAnotherTab : cloudFile.openFile)(file);

    if (shouldCloseModal) {
      onClose();
    }
  };

  const duplicateFile = async (file: IFile) => {
    const { data, res, shouldCloseModal } = await cloudFile.duplicateFile(file.uuid);

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
    <MyCloudContext
      value={{
        editingId,
        fileOperation: {
          delete: deleteFile,
          download: cloudFile.downloadFile,
          duplicate: duplicateFile,
          open: openFile,
          rename: renameFile,
        },
        files,
        onClose,
        selectedId,
        setEditingId,
        setSelectedId,
        setSortBy,
        sortBy,
      }}
    >
      {children}
    </MyCloudContext>
  );
}
