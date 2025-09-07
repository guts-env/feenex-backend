import { type OrganizationType } from '@/database/types/db';
import { type IBaseRepositoryInterface } from '@/common/modules/base/types/base';

export interface IRepositoryOrganization extends IBaseRepositoryInterface {
  name: string;
  type: OrganizationType;
}
