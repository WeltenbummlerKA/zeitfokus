import {gql} from '@apollo/client';

export const AISettings = gql`
    query AISettings {
        aiSettings { provider baseURL model timeoutSeconds }
    }
`;

export const SetAISettings = gql`
    mutation SetAISettings($settings: InputAISettings!) {
        setAISettings(settings: $settings) { provider baseURL model timeoutSeconds }
    }
`;
