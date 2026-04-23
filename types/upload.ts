export interface UploadedFile {
  filename: string;
  originalName: string;
  src: string;
  thumb: string;
  size: number;
  w?: number;
  h?: number;
  uploadedAt: string;
}

export interface UploadResponse {
  file: UploadedFile;
}

export interface UploadErrorResponse {
  error: string;
}
