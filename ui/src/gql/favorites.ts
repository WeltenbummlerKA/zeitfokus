import {gql} from '@apollo/client';

export const Favorites = gql`
    query Favorites {
        favorites {
            id
            title
            note
            position
            tags {
                key
                value
            }
        }
    }
`;
export const CreateFavorite = gql`
    mutation CreateFavorite($input: InputFavorite!) {
        createFavorite(input: $input) {
            id
            title
            note
            position
            tags {
                key
                value
            }
        }
    }
`;
export const UpdateFavorite = gql`
    mutation UpdateFavorite($id: Int!, $input: InputFavorite!) {
        updateFavorite(id: $id, input: $input) {
            id
            title
            note
            position
            tags {
                key
                value
            }
        }
    }
`;
export const RemoveFavorite = gql`
    mutation RemoveFavorite($id: Int!) {
        removeFavorite(id: $id) {
            id
        }
    }
`;
