import {
  IExpenseItem,
  IExpenseOtherDetails,
} from '@/modules/expenses/types/expenses';

export interface IExtractedData {
  total_amount: number;
  merchant_name: string;
  items: IExpenseItem[];
  other_details: IExpenseOtherDetails[];
  date: Date;
  category: string;
}

export interface IRepositoryLlmResult extends IBaseRepositoryInterface {
  ocr_result_id: string;
  extracted_data?: IExtractedData;
  status: ProcessingStatusEnum;
  error_message?: string;
  processing_time_ms?: number;
}
