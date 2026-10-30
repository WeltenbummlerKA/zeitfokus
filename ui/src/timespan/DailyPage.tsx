import {Box, Typography} from '@mui/material';
import moment from 'moment';
import {t, useI18n} from '../i18n';
import * as React from 'react';
import {Tracker} from './Tracker';
import {ActiveTrackers} from './ActiveTrackers';
import {DoneTrackers} from './DoneTrackers';
import {TagSelectorEntry} from '../tag/tagSelectorEntry';
import {RefreshTimeSpans} from './RefreshTimespans';
import {WorkTargetSummary} from '../setting/WorkTargetSummary';
import {useSettings} from '../gql/settings';
import {useQuery} from '@apollo/client';
import {TrackersQuery} from '../gql/__generated__';
import {Trackers} from '../gql/timeSpan';

export const DailyPage = () => {
    useI18n();
    const settings = useSettings();
    const timers = useQuery<TrackersQuery>(Trackers);
    const hasSummary = !!timers.data?.timers?.length || !!settings.workTargetProfile?.enabled;
    const [selectedEntries, setSelectedEntries] = React.useState<TagSelectorEntry[]>([]);
    return (
        <Box className="time-workspace" sx={{width: '100%', minWidth: 0}}>
            <Box sx={{mb: 4}}>
                <Typography color="text.secondary" sx={{mb: 1}}>
                    {moment().format('dddd, LL')}
                </Typography>
                <Typography component="h2" variant="h1">
                    {t('Time tracking')}
                </Typography>
                <Typography color="text.secondary" sx={{mt: 1, maxWidth: 640}}>
                    {t('Keep your work in view. Start a timer or record time afterwards.')}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: 'minmax(0, 1fr)', xl: hasSummary ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)'},
                    gap: 3,
                    alignItems: 'start',
                }}>
                <Box sx={{minWidth: 0}}>
                    <Tracker selectedEntries={selectedEntries} onSelectedEntriesChanged={setSelectedEntries} />
                </Box>
                {hasSummary && (
                    <Box sx={{minWidth: 0, '& > :first-child': {mt: 0}}}>
                        <ActiveTrackers />
                        <WorkTargetSummary />
                    </Box>
                )}
            </Box>
            <DoneTrackers
                addTagsToTracker={
                    selectedEntries.length === 0 ? (entries) => setSelectedEntries(selectedEntries.concat(entries)) : undefined
                }
            />
            <RefreshTimeSpans />
        </Box>
    );
};
