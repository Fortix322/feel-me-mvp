import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body('email') email: string) {
    return this.userService.register(email);
  }

  @Post('join-partner')
  async joinPartner(
    @Body('userId') userId: string,
    @Body('partnerCode') partnerCode: string,
  ) {
    return this.userService.joinPartner(userId, partnerCode);
  }
}
