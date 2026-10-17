// DOCeasy - API Client

import axios, { type AxiosResponse, type AxiosProgressEvent } from 'axios';
import type { Tool, Job, ProcessingOptions } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 minutes for large files
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: any) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export const apiClient = {
  // Health check
  health: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Tools
  getTools: async (): Promise<Tool[]> => {
    const res = await api.get('/tools');
    return res.data;
  },

  getTool: async (toolId: string): Promise<Tool> => {
    const res = await api.get(`/tools/${toolId}`);
    return res.data;
  },

  // Jobs
  createJob: async (
    toolId: string,
    files: File[],
    options: ProcessingOptions = {},
    onUploadProgress?: (pct: number) => void
  ): Promise<Job> => {
    const formData = new FormData();
    formData.append('tool_id', toolId);
    formData.append('options', JSON.stringify(options));
    files.forEach((file) => formData.append('files', file));

    const res = await api.post('/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt: AxiosProgressEvent) => {
        if (evt.total && onUploadProgress) {
          onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return res.data;
  },

  getJob: async (jobId: string): Promise<Job> => {
    const res = await api.get(`/jobs/${jobId}`);
    return res.data;
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await api.delete(`/jobs/${jobId}`);
  },

  getJobMetadata: async (jobId: string): Promise<Record<string, unknown>> => {
    const res = await api.get(`/jobs/${jobId}/metadata`);
    return res.data;
  },

  getDownloadUrl: (jobId: string): string => {
    return `/api/jobs/${jobId}/download`;
  },
};

// Poll job status until completion
export const pollJob = async (
  jobId: string,
  onUpdate?: (job: Job) => void,
  intervalMs = 1000,
  maxWaitMs = 300000
): Promise<Job> => {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const job = await apiClient.getJob(jobId);
    onUpdate?.(job);

    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Processing timed out. Please try again with a smaller file.');
};

export default api;
