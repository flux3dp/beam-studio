import type { IData } from '@core/interfaces/INounProject';

import type { ResponseWithError } from './base';
import { axiosFluxId, handleErrorMessage } from './base';

export const getNPIconsByTerm = async (term: string, nextPage?: string): Promise<IData | null> => {
  const response = (await axiosFluxId.get(`/api/np/icons/${term}`, {
    params: {
      next_page: nextPage,
    },
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    handleErrorMessage(response.error);

    return null;
  }

  return response.data.data;
};

export const getNPIconByID = async (id: string): Promise<null | string> => {
  const response = (await axiosFluxId.get(`/api/np/icon/${id}`, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.error) {
    handleErrorMessage(response.error);

    return null;
  }

  return response.data.base64;
};
