export interface IRepositoryPermission extends IBaseRepositoryInterface {
  name: string;
  description?: string;
  resource: PermissionResourceEnum;
  action: PermissionActionEnum;
}
