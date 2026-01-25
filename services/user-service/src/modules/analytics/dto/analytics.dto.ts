import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class TransactionStats {
  @Field(() => String)
  totalMint: string;

  @Field(() => String)
  totalBurn: string;
}

@ObjectType()
export class RecentUser {
  @Field(() => String)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  firstName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class UserStats {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  activeUsers: number;

  @Field(() => Int)
  adminUsers: number;

  @Field(() => Int)
  regularUsers: number;

  @Field(() => [RecentUser])
  recentUsers: RecentUser[];
}

@ObjectType()
export class TransactionTrend {
  @Field(() => String)
  date: string;

  @Field(() => Float)
  mint: number;

  @Field(() => Float)
  burn: number;

  @Field(() => Float)
  deposit: number;

  @Field(() => Float)
  withdraw: number;
}

@ObjectType()
export class DashboardOverview {
  @Field(() => TransactionStats)
  transactions: TransactionStats;

  @Field(() => UserStats)
  users: UserStats;

  @Field(() => [TransactionTrend])
  trends: TransactionTrend[];
}
