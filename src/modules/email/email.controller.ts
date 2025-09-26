import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ModuleRoutes } from '@/common/constants/routes';
import { EmailService } from '@/modules/email/email.service';
import { Authenticated } from '@/modules/auth/decorators/auth.decorator';
import SendSupportEmailDto from '@/modules/email/dto/send-support-email.dto';

@Controller(ModuleRoutes.Email.Main)
@Authenticated()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post(ModuleRoutes.Email.Paths.Support)
  @HttpCode(HttpStatus.CREATED)
  async sendSupportEmail(@Body() sendSupportEmailDto: SendSupportEmailDto) {
    const { name, email, subject, message, customSubject } =
      sendSupportEmailDto;

    await this.emailService.sendSupportEmail(
      name,
      email,
      subject,
      message,
      customSubject || '',
    );
  }
}
