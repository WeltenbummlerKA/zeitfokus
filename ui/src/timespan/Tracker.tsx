import {t, useI18n} from '../i18n';
import * as React from 'react';
import {TagSelectorEntry} from '../tag/tagSelectorEntry';
import {TagSelector} from '../tag/TagSelector';
import moment from 'moment-timezone';
import {Box, Button, Typography, ToggleButton, ToggleButtonGroup, TextField, Chip, Stack} from '@mui/material';
import Paper from '@mui/material/Paper';
import {DateTimeSelector} from '../common/DateTimeSelector';
import {useMutation} from '@apollo/client';
import * as gqlTimeSpan from '../gql/timeSpan';
import {
    StartTimerMutation,
    StartTimerMutationVariables,
    InputTimeSpanTag,
    AddTimeSpanMutation,
    AddTimeSpanMutationVariables,
} from '../gql/__generated__';
import {useSnackbar} from 'notistack';
import {inUserTz} from './timeutils';
import {handleError} from '../utils/errors';
import {addTimeSpanToCache} from '../gql/utils';

enum Type {
    Tracker,
    Manual,
}

export const calcShowDate = (from: moment.Moment, to: moment.Moment) => {
    const fromString = from.format('YYYYMMDD');
    return fromString !== to.format('YYYYMMDD') || moment().format('YYYYMMDD') !== fromString;
};

interface TrackerProps {
    onSelectedEntriesChanged: (entries: TagSelectorEntry[]) => void;
    selectedEntries: TagSelectorEntry[];
}

export const Tracker: React.FC<TrackerProps> = ({selectedEntries, onSelectedEntriesChanged: setSelectedEntries}) => {
    useI18n();
    const [type, setType] = React.useState<Type>(Type.Tracker);
    const [from, setFrom] = React.useState<moment.Moment>(moment().subtract(15, 'minute'));
    const [to, setTo] = React.useState<moment.Moment>(moment());
    const [showDate, setShowDate] = React.useState(false);
    const [note, setNote] = React.useState('');
    const [recentNotes, setRecentNotes] = React.useState<string[]>([]);
    const [startTimer, {loading: starting}] = useMutation<StartTimerMutation, StartTimerMutationVariables>(
        gqlTimeSpan.StartTimer,
        {
            refetchQueries: [{query: gqlTimeSpan.Trackers}],
            awaitRefetchQueries: true,
        }
    );
    const [addTimeSpan, {loading: adding}] = useMutation<AddTimeSpanMutation, AddTimeSpanMutationVariables>(
        gqlTimeSpan.AddTimeSpan,
        {
            refetchQueries: ['History'],
            awaitRefetchQueries: true,
            update: (cache, {data}) => {
                if (!data || !data.createTimeSpan) {
                    return;
                }
                addTimeSpanToCache(cache, data.createTimeSpan);
            },
        }
    );
    const {enqueueSnackbar} = useSnackbar();

    React.useEffect(() => {
        const handle = window.setInterval(() => {
            setShowDate(calcShowDate(from, to));
        }, 10000);
        return () => clearInterval(handle);
    }, [showDate, from, to]);

    const submit = () => {
        if (starting || adding) {
            return;
        }
        const tags = selectedEntries.map((entry: TagSelectorEntry): InputTimeSpanTag => ({
            key: entry.tag.key,
            value: entry.value,
        }));
        if (type === Type.Tracker) {
            const cleanNote = note.trim();
            startTimer({variables: {start: inUserTz(moment()).format(), tags, note: cleanNote}})
                .then(() => {
                    setSelectedEntries([]);
                    setNote('');
                    if (cleanNote) {
                        setRecentNotes((previous) => [cleanNote, ...previous.filter((item) => item !== cleanNote)].slice(0, 5));
                    }
                    enqueueSnackbar(t('tracker started'), {variant: 'success'});
                })
                .catch(handleError(t('Start timer'), enqueueSnackbar));
        } else {
            const cleanNote = note.trim();
            addTimeSpan({variables: {start: inUserTz(from).format(), end: inUserTz(to).format(), tags, note: cleanNote}})
                .then(() => {
                    setSelectedEntries([]);
                    setNote('');
                    if (cleanNote) {
                        setRecentNotes((previous) => [cleanNote, ...previous.filter((item) => item !== cleanNote)].slice(0, 5));
                    }
                    enqueueSnackbar(t('time span added'), {variant: 'success'});
                })
                .catch(handleError(t('Add time entry'), enqueueSnackbar));
        }
    };

    return (
        <Paper className="tracker-composer" sx={{p: {xs: 2.5, sm: 3}, borderRadius: '18px'}}>
            <Box className="composer-heading">
                <Typography component="h3" variant="h4">
                    {t('New entry')}
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={type}
                    aria-label={t('Entry mode')}
                    onChange={(_, next: Type | null) => {
                        if (next !== null) {
                            setType(next);
                        }
                    }}>
                    <ToggleButton value={Type.Tracker}>{t('Tracker')}</ToggleButton>
                    <ToggleButton value={Type.Manual}>{t('Manual')}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <div className="tracker-tags">
                <TagSelector
                    selectedEntries={selectedEntries}
                    onSelectedEntriesChanged={setSelectedEntries}
                    onCtrlEnter={submit}
                />
            </div>
            <TextField
                fullWidth
                label={t('Description')}
                placeholder={t('What are you working on?')}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                inputProps={{maxLength: 500}}
                sx={{mb: 2}}
            />
            {recentNotes.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{mb: 2, flexWrap: 'wrap', gap: 1}} aria-label={t('Recent descriptions')}>
                    <Typography variant="caption" color="text.secondary" sx={{alignSelf: 'center'}}>
                        {t('Recent')}
                    </Typography>
                    {recentNotes.map((recent) => (
                        <Chip key={recent} label={recent} size="small" onClick={() => setNote(recent)} />
                    ))}
                </Stack>
            ) : null}
            {type === Type.Manual ? (
                <div>
                    <DateTimeSelector
                        selectedDate={from}
                        onSelectDate={(newFrom) => {
                            if (!newFrom.isValid()) {
                                return;
                            }
                            setFrom(newFrom);
                            if (moment(newFrom).isAfter(to)) {
                                const newTo = moment(newFrom).add(15, 'minute');
                                setTo(newTo);
                                setShowDate(calcShowDate(newFrom, newTo));
                            } else {
                                setShowDate(calcShowDate(newFrom, to));
                            }
                        }}
                        showDate={showDate}
                        label={t('start')}
                    />
                    <DateTimeSelector
                        selectedDate={to}
                        onSelectDate={(newTo) => {
                            if (!newTo.isValid()) {
                                return;
                            }
                            setTo(newTo);
                            if (moment(newTo).isBefore(from)) {
                                const newFrom = moment(newTo).subtract(15, 'minute');
                                setFrom(newFrom);
                                setShowDate(calcShowDate(newFrom, newTo));
                            } else {
                                setShowDate(calcShowDate(from, newTo));
                            }
                        }}
                        showDate={showDate}
                        label={t('end')}
                    />
                </div>
            ) : null}
            <Button variant="contained" disabled={starting || adding} onClick={submit}>
                {t(type === Type.Manual ? 'Add time entry' : 'Start timer')}
            </Button>
        </Paper>
    );
};
