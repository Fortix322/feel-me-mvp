import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('partner-code')
  getPartnerCode(@Query('email') email: string) {
    return this.userService.generatePartnerCode(email);
  }
}
