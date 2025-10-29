import axios from '../axios';
import { UploadResponse } from '../../types/api';

export const uploadService = {
  async uploadFile(
    file: File,
    type: 'resume' | 'logo' | 'avatar',
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await axios.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    });

    return response.data;
  },

  async deleteFile(fileUrl: string): Promise<void> {
    await axios.delete('/upload', {
      params: { fileUrl }
    });
  },

  getFileUrl(filename: string): string {
    return `${axios.defaults.baseURL}/uploads/${filename}`;
  }
}; 