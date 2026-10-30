import {gql} from '@apollo/client';

export const History = gql`
    query History($filter: InputHistoryFilter, $cursor: InputCursor) {
        history(filter: $filter, cursor: $cursor) {
            timeSpans {
                id
                start
                end
                oldStart
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
