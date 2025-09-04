import { Body, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ModuleRoutes } from '@/common/constants/routes';
import { CurrentOrganization } from '@/common/decorators/current-org.decorator';
import { UploadService } from '@/modules/upload/upload.service';
import { TestEmailService } from '@/modules/upload/test-email.service';
import PresignedUploadDto from '@/modules/upload/dto/presigned-upload.dto';
import { AllRoles } from '@/modules/auth/decorators/roles.decorator';
import { RoleProtected } from '@/modules/auth/decorators/auth.decorator';

@AllRoles()
@RoleProtected()
@Controller(ModuleRoutes.Upload.Main)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly testEmailService: TestEmailService,
  ) {}

  @Post(ModuleRoutes.Upload.Presigned)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @HttpCode(HttpStatus.OK)
  createPresignedUrl(
    @Body() dto: PresignedUploadDto,
    @CurrentOrganization('id') orgId: string,
  ) {
    return this.uploadService.createPresignedUrl(dto, orgId);
  }

  @Post('test-email')
  @Throttle({ default: { limit: 2, ttl: 300 } }) // 2 requests per 5 minutes
  @HttpCode(HttpStatus.OK)
  async sendTestEmail(@Query('email') email: string) {
    return this.testEmailService.sendTestEmail(email);
  }
}
