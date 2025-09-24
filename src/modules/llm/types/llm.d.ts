import { IExpenseItem } from '@/modules/expenses/types/expenses';

export interface IExtractedData {
  amount: number;
  merchantName: string;
  items: IExpenseItem[];
  invoiceDate: string;
  paymentDate: string;
  category: string;
  categoryId?: string;
  orNumber: string | null;
  isVat: boolean;
  vat: number | null;
}

export interface IRepositoryLlmResult extends IBaseRepositoryInterface {
  ocr_result_id: string;
  extracted_data?: IExtractedData;
  status: ProcessingStatusEnum;
  error_message?: string;
  processing_time_ms?: number;
}
