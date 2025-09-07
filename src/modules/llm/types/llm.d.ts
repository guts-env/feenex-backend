import {
  IExpenseItem,
  IExpenseOtherDetails,
} from '@/modules/expenses/types/expenses';

export interface IExtractedData {
  amount: string;
  merchantName: string;
  items: IExpenseItem[];
  otherDetails: IExpenseOtherDetails[];
  date: string;
  category: string;
}

export interface IRepositoryLlmResult extends IBaseRepositoryInterface {
  ocr_result_id: string;
  extracted_data?: IExtractedData;
  status: ProcessingStatusEnum;
  error_message?: string;
  processing_time_ms?: number;
}
