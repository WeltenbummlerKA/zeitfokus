import {t, useI18n} from '../i18n';
import * as React from 'react';
import {TagSelectorEntry} from '../tag/tagSelectorEntry';
import {TagSelector} from '../tag/TagSelector';
import moment from 'moment-timezone';
import {Button} from '@mui/material';
import {MoreVert} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ClickAwayListener from '@mui/material/ClickAwayListener';
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
    const [openMenu, setOpenMenu] = React.useState<null | HTMLElement>(null);
    const [type, setType] = React.useState<Type>(Type.Tracker);
    const [from, setFrom] = React.useState<moment.Moment>(moment().subtract(15, 'minute'));
    const [to, setTo] = React.useState<moment.Moment>(moment());
    const [showDate, setShowDate] = React.useState(false);
    const [startTimer, {loading: starting}] = useMutation<StartTimerMutation, StartTimerMutationVariables>(
        gqlTimeSpan.StartTimer,
        {
            refetchQueries: [{query: gqlTimeSpan.Trackers}],
        }
    );
    const [addTimeSpan, {loading: adding}] = useMutation<AddTimeSpanMutation, AddTimeSpanMutationVariables>(
        gqlTimeSpan.AddTimeSpan,
        {
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
            startTimer({variables: {start: inUserTz(moment()).format(), tags, note: ''}})
                .then(() => {
                    setSelectedEntries([]);
                    enqueueSnackbar(t('tracker started'), {variant: 'success'});
                })
                .catch(handleError(t('Start timer'), enqueueSnackbar));
        } else {
            addTimeSpan({variables: {start: inUserTz(from).format(), end: inUserTz(to).format(), tags, note: ''}})
                .then(() => {
                    setSelectedEntries([]);
                    enqueueSnackbar(t('time span added'), {variant: 'success'});
                })
                .catch(handleError(t('Add time entry'), enqueueSnackbar));
        }
    };

    return (
        <ClickAwayListener onClickAway={() => setOpenMenu(null)}>
            <Paper className="tracker-composer">
                <div className="tracker-tags">
                    <TagSelector
                        selectedEntries={selectedEntries}
                        onSelectedEntriesChanged={setSelectedEntries}
                        onCtrlEnter={submit}
                    />
                </div>
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
                <IconButton
                    aria-label={t('Timer options')}
                    onClick={(e: React.MouseEvent<HTMLElement>) => setOpenMenu(e.currentTarget)}
                    size="large">
                    <MoreVert />
                </IconButton>
                <Menu aria-haspopup="true" anchorEl={openMenu} open={openMenu !== null}>
                    <MenuItem
                        selected={type === Type.Tracker}
                        onClick={() => {
                            setOpenMenu(null);
                            setType(Type.Tracker);
                        }}>
                        {t('Tracker')}
                    </MenuItem>
                    <MenuItem
                        selected={type === Type.Manual}
                        onClick={() => {
                            setOpenMenu(null);
                            setType(Type.Manual);
                        }}>
                        {t('Manual')}
                    </MenuItem>
                </Menu>
            </Paper>
        </ClickAwayListener>
    );
};
