import {gql} from '@apollo/client';

export const AnalyzeTimeReport = gql`
    mutation AnalyzeTimeReport($input: InputAIAnalysis!) {
        analyzeTimeReport(input: $input) {
            text
            from
            to
            completedEntries
            totalSeconds
            averageSeconds
            daysWithActivity
        }
    }
`;
