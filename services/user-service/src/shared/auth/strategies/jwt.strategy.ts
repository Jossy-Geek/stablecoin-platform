import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserRoleEntity } from '../../database/entities/user-role.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRoleEntity)
    private userRoleRepository: Repository<UserRoleEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      relations: ['userRoles'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify the role from JWT is still active and not blocked
    const userRole = await this.userRoleRepository.findOne({
      where: {
        userId: payload.userId,
        role: payload.role,
        isActive: true,
        isBlocked: false,
      },
    });

    if (!userRole) {
      throw new UnauthorizedException('Role is no longer active or is blocked');
    }

    return {
      userId: user.id,
      email: user.email,
      role: payload.role,
    };
  }
}
