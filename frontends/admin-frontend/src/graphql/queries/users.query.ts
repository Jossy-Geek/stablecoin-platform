import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query GetUsers(
    $page: Int
    $limit: Int
    $role: String
    $filters: UserFilters
  ) {
    users(page: $page, limit: $limit, role: $role, filters: $filters) {
      data {
        id
        displayId
        email
        firstName
        lastName
        mobileNumber
        countryCode
        profileImage
        isVerified
        roles {
          role
          isActive
          isBlocked
        }
        createdAt
      }
      total
      totalPages
      page
      limit
    }
  }
`;
