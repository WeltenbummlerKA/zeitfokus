import {t, useI18n} from '../i18n';
import * as React from 'react';
import {NetworkStatus, useMutation, useQuery} from '@apollo/client';
import {History} from '../gql/history';
import * as gqlTag from '../gql/tags';
import {TimeSpan, TimeSpanProps} from './TimeSpan';
import {HistoryQuery, HistoryQueryVariables, InputHistoryFilter, TagsQuery} from '../gql/__generated__';
import moment from 'moment';
import {Alert, Box, Button, LinearProgress, Paper, Stack, Typography} from '@mui/material';
import Refresh from '@mui/icons-material/Refresh';
import {toGroupedTimeSpanProps} from './timespanutils';
import {TagSelectorEntry} from '../tag/tagSelectorEntry';
import {HistoryFilters} from './HistoryFilters';
import {historyFilterFromDraft, formatHistoryDuration} from './historyFilterUtils';
import {HistoryCsvExport} from '../history/HistoryCsvExport';
import {AnalyzeTimeReport} from '../gql/aiAnalysis';
import {Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';

interface DoneTrackersProps {
    addTagsToTracker?: (entries: TagSelectorEntry[]) => void;
}

export const DoneTrackers: React.FC<DoneTrackersProps> = ({addTagsToTracker}) => {
    useI18n();
    const [filter, setFilter] = React.useState<InputHistoryFilter>({});
    const [pageError, setPageError] = React.useState(false);
    const [analysisOpen, setAnalysisOpen] = React.useState(false);
    const [analyze, analysis] = useMutation(AnalyzeTimeReport);
    const history = useQuery<HistoryQuery, HistoryQueryVariables>(History, {
        variables: {filter, cursor: {pageSize: 30}},
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'cache-and-network',
    });
    const tags = useQuery<TagsQuery>(gqlTag.Tags);
    const fetchingMore = history.networkStatus === NetworkStatus.fetchMore;
    const busy = history.loading || tags.loading;
    const result = history.data?.history;
    const visible = !!result && (!history.loading || fetchingMore) && !history.error && !tags.error;
    const values = visible ? toGroupedTimeSpanProps(result.timeSpans, tags.data?.tags || [], moment()) : [];
    const refresh = () => {
        setPageError(false);
        void history.refetch({filter, cursor: {pageSize: 30}}).catch(() => {});
    };
    const loadMore = () => {
        if (!result || busy || !result.cursor.hasMore) {
            return;
        }
        setPageError(false);
        void history
            .fetchMore({
                variables: {
                    filter,
                    cursor: {startId: result.cursor.startId, offset: result.cursor.offset, pageSize: result.cursor.pageSize},
                },
                updateQuery: (previous, {fetchMoreResult}) => {
                    if (!fetchMoreResult) {
                        return previous;
                    }
                    const combined = [...previous.history.timeSpans, ...fetchMoreResult.history.timeSpans];
                    return {
                        history: {
                            ...fetchMoreResult.history,
                            timeSpans: [...new Map(combined.map((entry) => [entry.id, entry])).values()],
                        },
                    };
                },
            })
            .catch(() => setPageError(true));
    };
    return (
        <Box component="section" className="history-section" sx={{mt: 4}} aria-labelledby="history-heading">
            <Stack direction="row" sx={{justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2}}>
                <Typography id="history-heading" component="h3" variant="h4">
                    {t('Your entries')}
                </Typography>
                <Button startIcon={<Refresh />} disabled={busy} onClick={refresh}>
                    {t('Refresh history')}
                </Button>
            </Stack>
            <Paper sx={{p: {xs: 2, sm: 3}, mb: 3, borderRadius: '18px'}}>
                <HistoryFilters
                    onApply={(draft) => {
                        setPageError(false);
                        setFilter(historyFilterFromDraft(draft));
                    }}
                />
                <Box sx={{mt: 2}}>
                    <HistoryCsvExport filter={filter} disabled={!visible} />
                    <Button
                        sx={{ml: 1}}
                        variant="outlined"
                        disabled={!visible || !filter.from || !filter.toExclusive || analysis.loading}
                        onClick={() => {
                            const from = moment(filter.from, 'YYYY-MM-DD').startOf('day').toISOString();
                            const toExclusive = moment(filter.toExclusive).startOf('day').toISOString();
                            void analyze({variables: {input: {from, toExclusive}}}).then(() => setAnalysisOpen(true)).catch(() => setAnalysisOpen(true));
                        }}>
                        {analysis.loading ? t('Analyzing…') : t('Analyze with AI')}
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                    {t(
                        'Dates use your browser time zone. Totals include completed entries and are clipped to the selected period.'
                    )}
                </Typography>
                {busy && <LinearProgress aria-label={t('Loading history')} sx={{mt: 2}} />}
                {visible && (
                    <Box
                        role="status"
                        aria-live="polite"
                        sx={{mt: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 2}}>
                        <Typography variant="h4" component="p" sx={{fontVariantNumeric: 'tabular-nums'}}>
                            {formatHistoryDuration(result.totalSeconds)}{' '}
                            <Typography component="span" variant="body2">
                                {t('hours')}
                            </Typography>
                        </Typography>
                        <Typography color="text.secondary">
                            {t('{count} matching entries', {count: result.matchingCount})}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {t('Total across all matching entries')}
                        </Typography>
                    </Box>
                )}
            </Paper>
            <Dialog open={analysisOpen} onClose={() => setAnalysisOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{t('AI time report')}</DialogTitle>
                <DialogContent dividers>
                    {analysis.error && <Alert severity="error">{t('AI analysis failed. Check the server configuration.')}</Alert>}
                    {analysis.data?.analyzeTimeReport && (
                        <Stack spacing={2}>
                            <Typography sx={{whiteSpace: 'pre-wrap'}}>{analysis.data.analyzeTimeReport.text}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('{count} completed entries, {duration} total', {
                                    count: analysis.data.analyzeTimeReport.completedEntries,
                                    duration: formatHistoryDuration(analysis.data.analyzeTimeReport.totalSeconds),
                                })}
                            </Typography>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setAnalysisOpen(false)}>{t('Close')}</Button></DialogActions>
            </Dialog>
            {(history.error || tags.error) && (
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            onClick={() => {
                                refresh();
                                void tags.refetch().catch(() => {});
                            }}>
                            {t('Retry')}
                        </Button>
                    }
                    sx={{mb: 2}}>
                    {t('Could not load history. Please retry.')}
                </Alert>
            )}
            {visible && result.matchingCount === 0 && (
                <Paper sx={{p: 4, mb: 3, borderRadius: '18px'}}>
                    <Typography variant="h6">{t('No matching entries')}</Typography>
                    <Typography color="text.secondary" sx={{mt: 1}}>
                        {t('Change or reset the filters, or add a completed entry.')}
                    </Typography>
                </Paper>
            )}
            {values.map(({key, timeSpans}) => (
                <DatedTimeSpans
                    key={key}
                    name={key}
                    timeSpans={timeSpans}
                    addTagsToTracker={addTagsToTracker}
                    onChanged={refresh}
                />
            ))}
            {pageError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {t('Could not load more entries. Please retry.')}
                </Alert>
            )}
            {visible && result.cursor.hasMore && (
                <Button variant="outlined" disabled={busy} onClick={loadMore}>
                    {fetchingMore ? t('Loading history') : t('Load more entries')}
                </Button>
            )}
        </Box>
    );
};

const DatedTimeSpans: React.FC<{name: string; timeSpans: TimeSpanProps[]; onChanged: () => void} & DoneTrackersProps> = ({
    name,
    timeSpans,
    addTagsToTracker,
    onChanged,
}) => (
    <Paper className="history-day" sx={{mb: 3, borderRadius: '18px', overflow: 'hidden'}}>
        <Typography component="h4" sx={{px: 3, py: 2, fontWeight: 600, borderBottom: 1, borderColor: 'divider'}}>
            {name}
        </Typography>
        {timeSpans.map((props) => (
            <TimeSpan
                key={props.id}
                {...props}
                addTagsToTracker={addTagsToTracker}
                rangeChange={onChanged}
                deleted={onChanged}
                stopped={onChanged}
            />
        ))}
    </Paper>
);
