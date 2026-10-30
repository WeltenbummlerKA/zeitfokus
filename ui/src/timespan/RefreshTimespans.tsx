import {t, useI18n} from '../i18n';
import * as React from 'react';
import {useQuery} from '@apollo/client';
import {TimeSpansQuery, TimeSpansQueryVariables} from '../gql/__generated__';
import * as gqlTimeSpan from '../gql/timeSpan';
import {useSnackbar} from 'notistack';
import {isSameDate} from '../utils/time';
import moment from 'moment';
import {Fab, Zoom} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

export const RefreshTimeSpans: React.FC = () => {
    useI18n();
    const {refetch, data} = useQuery<TimeSpansQuery, TimeSpansQueryVariables>(gqlTimeSpan.TimeSpans, {
        variables: {cursor: {pageSize: 30}},
    });
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    const hasMovedEntries =
        data &&
        data.timeSpans &&
        data.timeSpans.timeSpans.some(({start, oldStart}) => !isSameDate(moment(start), oldStart ? moment(oldStart) : undefined));
    React.useEffect(() => {
        if (hasMovedEntries) {
            const id = enqueueSnackbar(t('Some messages where moved, use the refresh button to reorder the timespans'), {
                variant: 'info',
                persist: true,
                preventDuplicate: true,
            });
            return () => {
                if (id) {
                    closeSnackbar(id);
                }
            };
        }
        return () => {};
    }, [hasMovedEntries, enqueueSnackbar, closeSnackbar]);

    if (!hasMovedEntries) {
        return <></>;
    }

    return (
        <Zoom
            in={true}
            timeout={50}
            style={{
                transitionDelay: `5ms`,
            }}
            unmountOnExit>
            <Fab
                aria-label={t('refresh')}
                onClick={() => {
                    refetch({cursor: {pageSize: 30}}).then(() => {
                        enqueueSnackbar(t('Refreshed messages'), {variant: 'success'});
                    });
                }}
                style={{position: 'fixed', bottom: '30px', right: '30px', zIndex: 100000}}
                color="primary">
                <RefreshIcon />
            </Fab>
        </Zoom>
    );
};
