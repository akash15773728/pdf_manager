// DOCeasy - Shared Types

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  accepted_types: string[];
  max_file_size_mb: number;
  max_files: number;
  output_type: string;
  requires_backend: boolean;
  icon: string;
}

export type ToolCategory =
  | 'organize'
  | 'compress'
  | 'convert'
  | 'edit'
  | 'security'
  | 'extract';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  job_id: string;
  status: JobStatus;
  tool_id: string;
  error?: string;
  output_filename?: string;
  output_size_bytes?: number;
  input_size_bytes?: number;
}

export interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

export interface ProcessingOptions {
  [key: string]: string | number | boolean | undefined;
}

export interface CompressionResult {
  original_size: number;
  output_size: number;
  reduction_pct: number;
}
