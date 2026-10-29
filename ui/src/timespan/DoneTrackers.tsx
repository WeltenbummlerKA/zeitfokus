import {t, useI18n} from '../i18n';
import * as React from 'react';
import {useQuery} from '@apollo/client';
import * as gqlTimeSpan from '../gql/timeSpan';
import * as gqlTag from '../gql/tags';
import {TimeSpan, TimeSpanProps} from './TimeSpan';
import {TagsQuery, TimeSpansQuery, TimeSpansQueryVariables} from '../gql/__generated__';
import {useInterval} from '../utils/hooks';
import moment from 'moment';
import {Box, Paper, Typography} from '@mui/material';
import {GroupedTimeSpanProps, toGroupedTimeSpanProps} from './timespanutils';
import {TagSelectorEntry} from '../tag/tagSelectorEntry';
import {isSameDate} from '../utils/time';

interface DoneTrackersProps {
    addTagsToTracker?: (entries: TagSelectorEntry[]) => void;
}

export const DoneTrackers: React.FC<DoneTrackersProps> = ({addTagsToTracker}) => {
    useI18n();
    const trackersResult = useQuery<TimeSpansQuery, TimeSpansQueryVariables>(gqlTimeSpan.TimeSpans, {
        variables: {cursor: {pageSize: 30}},
    });
    const loading = React.useRef(false);
    const tagsResult = useQuery<TagsQuery>(gqlTag.Tags);
    const [currentDate, setCurrentDate] = React.useState(moment());
    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
    useInterval(
        () => {
            if (!isSameDate(currentDate, moment())) {
                setCurrentDate(moment());
            }
        },
        1000,
        true
    );

    const fetchMore = React.useCallback(() => {
        if (!trackersResult || !trackersResult.data || trackersResult.loading || loading.current) {
            return;
        }
        loading.current = true;
        const {offset, pageSize, startId} = trackersResult.data.timeSpans.cursor;
        trackersResult
            .fetchMore({
                variables: {
                    cursor: {
                        startId,
                        offset,
                        pageSize,
                    },
                },
                updateQuery: (prev, {fetchMoreResult}): TimeSpansQuery => {
                    if (!fetchMoreResult) {
                        return prev;
                    }

                    return {
                        timeSpans: {
                            __typename: 'PagedTimeSpans',
                            timeSpans: [...prev.timeSpans.timeSpans, ...fetchMoreResult.timeSpans.timeSpans],
                            cursor: fetchMoreResult.timeSpans.cursor,
                        },
                    };
                },
            })
            .finally(() => {
                loading.current = false;
            });
    }, [trackersResult]);

    // Loads the next page once the sentinel div at the bottom of the list scrolls into view,
    // replacing react-infinite's windowed/virtualized approach - this list is a personal time
    // log, not large enough to need DOM virtualization.
    React.useEffect(() => {
        const target = loadMoreRef.current;
        if (!target) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchMore();
                }
            },
            {rootMargin: '2000px 0px'}
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [fetchMore]);

    const values: GroupedTimeSpanProps = (() => {
        if (
            trackersResult.error ||
            trackersResult.loading ||
            !trackersResult.data ||
            trackersResult.data.timeSpans === null ||
            tagsResult.error ||
            tagsResult.loading ||
            !tagsResult.data ||
            tagsResult.data.tags == null
        ) {
            return [];
        }
        return toGroupedTimeSpanProps(trackersResult.data.timeSpans.timeSpans, tagsResult.data.tags, currentDate);
    })();

    return (
        <Box component="section" className="history-section" sx={{mt: 4}}>
            <Typography component="h3" variant="h4" sx={{mb: 2}}>
                {t('Your entries')}
            </Typography>
            {!trackersResult.loading && !trackersResult.error && values.length === 0 && (
                <Paper sx={{p: 4, borderRadius: '18px'}}>
                    <Typography variant="h6">{t('No completed entries yet')}</Typography>
                    <Typography color="text.secondary" sx={{mt: 1}}>
                        {t('Stop a running timer or add a manual entry to start your log.')}
                    </Typography>
                </Paper>
            )}
            {values.map(({key, timeSpans}) => (
                <DatedTimeSpans key={key} name={key} timeSpans={timeSpans} addTagsToTracker={addTagsToTracker} />
            ))}
            <div ref={loadMoreRef} />
        </Box>
    );
};

const DatedTimeSpans: React.FC<
    {
        name: string;
        timeSpans: TimeSpanProps[];
    } & DoneTrackersProps
> = ({name, timeSpans, addTagsToTracker}) => {
    return (
        <Paper className="history-day" key={name} sx={{mb: 3, borderRadius: '18px', overflow: 'hidden'}}>
            <Typography component="h4" sx={{px: 3, py: 2, fontWeight: 600, borderBottom: 1, borderColor: 'divider'}}>
                {name}
            </Typography>
            {timeSpans.map((timeSpanProps) => (
                <TimeSpan key={timeSpanProps.id} {...timeSpanProps} addTagsToTracker={addTagsToTracker} />
            ))}
        </Paper>
    );
};
