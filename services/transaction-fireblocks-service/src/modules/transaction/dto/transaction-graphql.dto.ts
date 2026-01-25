import { ObjectType, Field, Int, InputType, registerEnumType } from '@nestjs/graphql';
import { TransactionType, TransactionStatus } from '../../../shared/database/entities/transaction.entity';

// Register enums for GraphQL
registerEnumType(TransactionType, {
  name: 'TransactionType',
});

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
});

@ObjectType()
export class Transaction {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field(() => TransactionType)
  transactionType: TransactionType;

  @Field()
  amount: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  toCurrency?: string;

  @Field(() => TransactionStatus)
  status: TransactionStatus;

  @Field({ nullable: true })
  txHash?: string;

  @Field({ nullable: true })
  note?: string;

  @Field({ nullable: true })
  destinationAddress?: string;

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@ObjectType()
export class PaginatedTransactions {
  @Field(() => [Transaction])
  data: Transaction[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@ObjectType()
export class TransactionStats {
  @Field()
  totalMint: string;

  @Field()
  totalBurn: string;
}

@InputType()
export class TransactionFilters {
  @Field({ nullable: true })
  id?: string;

  @Field(() => TransactionType, { nullable: true })
  transactionType?: TransactionType;

  @Field(() => TransactionStatus, { nullable: true })
  status?: TransactionStatus;

  @Field({ nullable: true })
  amount?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  txHash?: string;
}
