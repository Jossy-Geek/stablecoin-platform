import { Resolver, Query, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { StorageService } from '../../shared/storage/storage.service';
import { JwtAuthGuard } from '../../shared/auth/guards/jwt-auth.guard';
import { User, PaginatedUsers, UserFilters } from './dto/user-graphql.dto';

@Resolver(() => User)
@UseGuards(JwtAuthGuard)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService,
  ) {}

  @Query(() => PaginatedUsers, { name: 'users' })
  async getUsers(
    @Context() context: any,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
    @Args('role', { nullable: true }) role?: string,
    @Args('filters', { nullable: true, type: () => UserFilters }) filters?: UserFilters,
  ): Promise<PaginatedUsers> {
    const req = context.req;
    
    // Check if user is admin or super_admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const result = await this.userService.getUsersList({
      page,
      limit,
      role: role || 'user',
      displayId: filters?.displayId,
      email: filters?.email,
      firstName: filters?.firstName,
      lastName: filters?.lastName,
      countryCode: filters?.countryCode,
      mobileNumber: filters?.mobileNumber,
      active: filters?.active,
    });

    // Map users with profile image URLs
    const mappedData = await Promise.all(
      result.data.map(async (user: any) => {
        const userRoles = await this.userService.getUserRoles(user.id);
        const isVerified = userRoles.some((r: any) => r.isActive && !r.isBlocked);
        
        return {
          id: user.id,
          displayId: user.displayId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobileNumber: user.mobileNumber,
          countryCode: user.countryCode,
          profileImage: user.profileImage
            ? await this.storageService.getProfileImageUrl(user.profileImage, req.user.userId, req.user.role)
            : null,
          isVerified,
          roles: userRoles.map((r: any) => ({
            role: r.role,
            isActive: r.isActive !== undefined ? r.isActive : true,
            isBlocked: r.isBlocked !== undefined ? r.isBlocked : false,
          })),
          createdAt: user.createdAt,
        };
      }),
    );

    return {
      data: mappedData,
      total: result.total,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    };
  }
}
