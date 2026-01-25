import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../modules/user/user.repository';

@Injectable()
export class DisplayIdService {
  constructor(
    private userRepository: UserRepository,
  ) {}

  /**
   * Generate a unique display ID in format USR-XXXXXX
   * Checks database to ensure uniqueness
   */
  async generateUniqueDisplayId(): Promise<string> {
    let displayId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      // Generate random 6-digit number
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      displayId = `USR-${randomNum.toString().padStart(6, '0')}`;

      // Check if display ID already exists
      const exists = await this.userRepository.displayIdExists(displayId);

      if (!exists) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique display ID after multiple attempts');
    }

    return displayId;
  }
}
