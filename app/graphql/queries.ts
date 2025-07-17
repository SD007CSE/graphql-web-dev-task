import { gql } from "graphql-request";

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: UsersPermissionsLoginInput!) {
    login(input: $input) {
      jwt
      user {
        id
        username
        email
      }
    }
  }
`;

export const GET_USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
      email
      role
    }
  }
`;

export const USERS_QUERY = gql`
  query {
    userDbs {
      data {
        id
        attributes {
          name
          email
          role
        }
      }
    }
  }
`; 