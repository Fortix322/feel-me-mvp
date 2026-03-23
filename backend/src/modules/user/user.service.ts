import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  generatePartnerCode(email: string): { partnerCode: string } {
    const partnerCode = Math.random().toString();
    return { partnerCode };
  }
}
