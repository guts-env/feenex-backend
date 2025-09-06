import { IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IRepositoryCategory extends IBaseRepositoryInterface {
  organization_id: string;
  name: string;
  description: string;
  is_default: boolean;
}
