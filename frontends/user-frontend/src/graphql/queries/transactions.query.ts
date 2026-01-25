import { gql } from '@apollo/client';

export const GET_TRANSACTIONS = gql`
  query GetTransactions(
    $page: Int
    $limit: Int
    $filters: TransactionFilters
  ) {
    transactions(page: $page, limit: $limit, filters: $filters) {
      data {
        id
        userId
        transactionType
        amount
        currency
        toCurrency
        status
        txHash
        note
        destinationAddress
        createdAt
        updatedAt
      }
      total
      totalPages
      page
      limit
    }
  }
`;
