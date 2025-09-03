import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ModuleRoutes } from '@/common/constants/routes';
import { CurrentOrganization } from '@/common/decorators/current-org.decorator';
import { UploadService } from '@/modules/upload/upload.service';
import PresignedUploadDto from '@/modules/upload/dto/presigned-upload.dto';
import { AllUsers } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';

@AllUsers()
@RoleProtected()
@Controller(ModuleRoutes.Upload.Main)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(ModuleRoutes.Upload.Presigned)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createPresignedUrl(
    @Body() dto: PresignedUploadDto,
    @CurrentOrganization('id') orgId: string,
  ) {
    return this.uploadService.createPresignedUrl(dto, orgId);
  }
}
