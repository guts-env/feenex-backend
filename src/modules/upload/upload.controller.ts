import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ModuleRoutes } from '@/common/constants/routes';
import { CurrentOrganization } from '@/common/decorators/current-org.decorator';
import { UploadService } from '@/modules/upload/upload.service';
import PresignedUploadDto from '@/modules/upload/dto/presigned-upload.dto';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';

@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Upload.Main)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(ModuleRoutes.Upload.Paths.Presigned)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  createPresignedUrl(
    @Body() dto: PresignedUploadDto,
    @CurrentOrganization('id') orgId: string,
  ) {
    return this.uploadService.createPresignedUrl(dto, orgId);
  }
}
