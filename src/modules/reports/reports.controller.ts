import { Controller } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';

@Controller(ModuleRoutes.Reports.Main)
export class ReportsController {}
