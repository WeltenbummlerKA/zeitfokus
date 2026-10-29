import {Box, Typography} from '@mui/material';
import moment from 'moment';
import {t, useI18n} from '../i18n';
import * as React from 'react';
import {Tracker} from './Tracker';
import {ActiveTrackers} from './ActiveTrackers';
import {DoneTrackers} from './DoneTrackers';
import {TagSelectorEntry} from '../tag/tagSelectorEntry';
import {RefreshTimeSpans} from './RefreshTimespans';

export const DailyPage = () => {
    useI18n();
    const [selectedEntries, setSelectedEntries] = React.useState<TagSelectorEntry[]>([]);
    return (
        <Box className="time-workspace" sx={{maxWidth: 1120, mx: 'auto'}}>
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
            <Tracker selectedEntries={selectedEntries} onSelectedEntriesChanged={setSelectedEntries} />
            <ActiveTrackers />
            <DoneTrackers
                addTagsToTracker={
                    selectedEntries.length === 0 ? (entries) => setSelectedEntries(selectedEntries.concat(entries)) : undefined
                }
            />
            <RefreshTimeSpans />
        </Box>
    );
};
