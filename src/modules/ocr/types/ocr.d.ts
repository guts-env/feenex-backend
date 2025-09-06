export interface IRepositoryOcrResult extends IBaseRepositoryInterface {
  organization_id: string;
  user_id: string;
  ocr_text?: string;
  entities?: any;
  status: ProcessingStatusEnum;
  confidence_score?: number;
  error_message?: string;
  processing_time_ms?: number;
  image_path: string;
}
