import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';

@ObjectType()
export class UserRole {
  @Field()
  role: string;

  @Field()
  isActive: boolean;

  @Field()
  isBlocked: boolean;
}

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  displayId: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  mobileNumber?: string;

  @Field({ nullable: true })
  countryCode?: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field()
  isVerified: boolean;

  @Field(() => [UserRole])
  roles: UserRole[];

  @Field()
  createdAt: string;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [User])
  data: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@InputType()
export class UserFilters {
  @Field({ nullable: true })
  displayId?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  countryCode?: string;

  @Field({ nullable: true })
  mobileNumber?: string;

  @Field({ nullable: true })
  active?: boolean;
}
