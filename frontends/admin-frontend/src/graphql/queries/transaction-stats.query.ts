import { gql } from '@apollo/client';

export const GET_TRANSACTION_STATS = gql`
  query GetTransactionStats {
    transactionStats {
      totalMint
      totalBurn
    }
  }
`;
