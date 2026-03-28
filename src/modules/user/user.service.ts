import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from '@modules/user/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  private generatePartnerCode(email: string): { partnerCode: string } {
    const partnerCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return { partnerCode };
  }

  async register(email: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return existingUser;
    }

    const { partnerCode } = this.generatePartnerCode(email);
    const user = await this.userRepository.createUser(email, partnerCode);
    return user[0];
  }

  async joinPartner(userId: string, partnerCode: string) {
    const partner = await this.userRepository.findByPartnerCode(partnerCode);
    if (!partner) {
      throw new BadRequestException('Invalid partner code');
    }

    if (partner.id === userId) {
      throw new BadRequestException('You cannot partner with yourself');
    }

    if (partner.partnerId) {
      throw new BadRequestException('This partner is already paired');
    }

    // Link both ways
    await this.userRepository.updatePartner(userId, partner.id);
    await this.userRepository.updatePartner(partner.id, userId);

    return { success: true };
  }

  async joinPartnerById(userId: string, partnerId: string) {
    const user = await this.userRepository.findById(userId);
    const partner = await this.userRepository.findById(partnerId);

    if (!user || !partner) {
      throw new BadRequestException('User not found');
    }

    if (user.partnerId || partner.partnerId) {
      throw new BadRequestException('One of the users is already paired');
    }

    // Link both ways
    await this.userRepository.updatePartner(userId, partnerId);
    await this.userRepository.updatePartner(partnerId, userId);

    return { success: true };
  }
}
