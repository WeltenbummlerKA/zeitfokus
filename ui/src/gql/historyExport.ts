import {gql} from '@apollo/client';

export const HistoryCsvPage = gql`
    query HistoryCsvPage($filter: InputHistoryFilter, $cursor: InputCursor) {
        history(filter: $filter, cursor: $cursor) {
            timeSpans {
                id
                start
                end
                note
                tags {
                    key
                    value
                }
            }
            cursor {
                hasMore
                offset
                startId
                pageSize
            }
            matchingCount
            totalSeconds
        }
    }
`;
