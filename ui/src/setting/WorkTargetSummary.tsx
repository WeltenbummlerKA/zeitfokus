import * as React from 'react';
import moment from 'moment';
import {useQuery} from '@apollo/client';
import {Alert, Box, LinearProgress, Paper, Stack, Typography} from '@mui/material';
import {HistoryQuery, HistoryQueryVariables} from '../gql/__generated__';
import {History} from '../gql/history';
import {useSettings} from '../gql/settings';
import {useI18n} from '../i18n';
import {dailyTargetHours, workTargetWeekRange} from './workTargetUtils';

const duration = (hours: number) => {
    const minutes = Math.round(Math.abs(hours) * 60);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
};

const labels = {
    de: {
        title: 'Deine Woche · Soll / Ist',
        region: 'Soll-/Ist-Auswertung',
        failed: 'Die Wochenwerte konnten nicht geladen werden.',
        recorded: 'Erfasst (abgeschlossen)',
        target: 'Wochenziel',
        remaining: 'Bis zum Wochenziel',
        above: 'Über dem Wochenziel',
        today: 'Tagesziel heute',
        note: 'Browser-Zeitzone · Laufende Timer, Feiertage und Abwesenheiten sind in diesem Vergleich nicht berücksichtigt.',
    },
    en: {
        title: 'Your week · target / actual',
        region: 'Target/actual comparison',
        failed: 'Could not load weekly totals.',
        recorded: 'Recorded (completed)',
        target: 'Weekly target',
        remaining: 'Remaining to target',
        above: 'Above target',
        today: "Today's target",
        note: 'Browser time zone · Running timers, public holidays and absences are not included in this comparison.',
    },
};

export const WorkTargetSummary: React.FC = () => {
    const {language} = useI18n();
    const settings = useSettings();
    const profile = settings.workTargetProfile;
    const [now, setNow] = React.useState(() => moment());
    React.useEffect(() => {
        const interval = window.setInterval(() => setNow(moment()), 30000);
        return () => window.clearInterval(interval);
    }, []);
    const range = workTargetWeekRange(now, settings.firstDayOfTheWeek);
    const {data, loading, error} = useQuery<HistoryQuery, HistoryQueryVariables>(History, {
        variables: {filter: range, cursor: {pageSize: 1}},
        skip: !profile?.enabled,
        pollInterval: 30000,
        fetchPolicy: 'cache-and-network',
    });
    if (!settings.done || !profile?.enabled) {
        return null;
    }
    const text = labels[language];
    const actual = (data?.history.totalSeconds ?? 0) / 3600;
    const remaining = profile.weeklyHours - actual;
    return (
        <Paper component="section" aria-label={text.region} sx={{p: {xs: 2, sm: 3}, mt: 3, borderRadius: 3}}>
            <Typography component="h3" variant="h5" gutterBottom>
                {text.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                {moment(range.from).format('L')} – {moment(range.toExclusive).subtract(1, 'day').format('L')}
            </Typography>
            {error ? (
                <Alert severity="error">{text.failed}</Alert>
            ) : (
                <>
                    {loading && !data && <LinearProgress />}
                    <Stack direction="row" sx={{gap: 4, flexWrap: 'wrap'}}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                {text.recorded}
                            </Typography>
                            <Typography variant="h4" sx={{fontVariantNumeric: 'tabular-nums'}}>
                                {data ? duration(actual) : '—'} h
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                {text.target}
                            </Typography>
                            <Typography variant="h4">{duration(profile.weeklyHours)} h</Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                {remaining >= 0 ? text.remaining : text.above}
                            </Typography>
                            <Typography variant="h4">{data ? duration(remaining) : '—'} h</Typography>
                        </Box>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                        {text.today}: {duration(dailyTargetHours(profile.weeklyHours, profile.workDays, now.day()))} h
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{mt: 1}}>
                        {text.note}
                    </Typography>
                </>
            )}
        </Paper>
    );
};
