import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ModuleRoutes } from '@/common/constants/routes';
import { CurrentOrganization } from '@/common/decorators/current-org.decorator';
import { UploadService } from '@/modules/upload/upload.service';
import PresignedUploadDto, {
  PresignedUploadResDto,
} from '@/modules/upload/dto/presigned-upload.dto';
import {
  PresignedDownloadDto,
  PresignedDownloadResDto,
} from '@/modules/upload/dto/presigned-download.dto';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';

@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Upload.Main)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(ModuleRoutes.Upload.Paths.Presigned)
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  createPresignedUrl(
    @Body() dto: PresignedUploadDto,
    @CurrentOrganization('id') orgId: string,
  ): Promise<PresignedUploadResDto> {
    return this.uploadService.createPresignedUrl(dto, orgId);
  }

  @Post(ModuleRoutes.Upload.Paths.DownloadPresigned)
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  getPresignedUrl(
    @Body() dto: PresignedDownloadDto,
    @CurrentOrganization('id') orgId: string,
  ): Promise<PresignedDownloadResDto[]> {
    return this.uploadService.createMultiplePresignedDownloadUrls(
      dto.keys,
      orgId,
    );
  }
}
