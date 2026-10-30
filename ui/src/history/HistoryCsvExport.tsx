import * as React from 'react';
import {useApolloClient} from '@apollo/client';
import {Alert, Box, Button, Typography} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {useI18n} from '../i18n';
import {InputHistoryFilter} from '../gql/__generated__';
import {HistoryCsvPage} from '../gql/historyExport';
import {ExportCursor, ExportPage, historyToCsv, loadCompleteHistory} from './csvExport';

const labels = {
    de: {
        download: 'CSV exportieren',
        downloading: 'Export wird erstellt …',
        cancel: 'Abbrechen',
        failed: 'Export fehlgeschlagen. Bitte erneut versuchen. Bei Änderungen während des Exports bitte den Verlauf aktualisieren.',
        note: 'Exportiert alle abgeschlossenen Treffer der aktuellen Filter. Zeiten werden auf den gewählten Zeitraum begrenzt.',
        progress: 'Einträge geladen',
    },
    en: {
        download: 'Export CSV',
        downloading: 'Preparing export …',
        cancel: 'Cancel',
        failed: 'Export failed. Please retry. If entries changed during export, refresh the history first.',
        note: 'Exports all completed entries matching the current filters. Durations are clipped to the selected interval.',
        progress: 'entries loaded',
    },
};

export const HistoryCsvExport: React.FC<{filter: InputHistoryFilter; disabled?: boolean}> = ({filter, disabled}) => {
    const {language} = useI18n();
    const text = labels[language];
    const client = useApolloClient();
    const [working, setWorking] = React.useState(false);
    const [failed, setFailed] = React.useState(false);
    const [progress, setProgress] = React.useState('');
    const controller = React.useRef<AbortController>();
    React.useEffect(() => () => controller.current?.abort(), []);

    const download = async () => {
        if (controller.current) {
            return;
        }
        const request = new AbortController();
        controller.current = request;
        setWorking(true);
        setFailed(false);
        setProgress('');
        try {
            const entries = await loadCompleteHistory(
                async (cursor: ExportCursor) => {
                    const {data} = await client.query<{history: ExportPage}>({
                        query: HistoryCsvPage,
                        variables: {filter, cursor},
                        fetchPolicy: 'no-cache',
                        context: {fetchOptions: {signal: request.signal}},
                    });
                    return data.history;
                },
                request.signal,
                (count, total) => setProgress(`${count} / ${total}`)
            );
            const contents = historyToCsv(entries, filter);
            request.signal.throwIfAborted();
            const url = URL.createObjectURL(new Blob([contents], {type: 'text/csv;charset=utf-8'}));
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `zeitfokus-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            if (!request.signal.aborted) {
                setFailed(true);
            }
        } finally {
            controller.current = undefined;
            setWorking(false);
            setProgress('');
        }
    };

    return (
        <Box>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => void download()}
                    disabled={disabled || working}>
                    {working ? text.downloading : text.download}
                </Button>
                {working ? <Button onClick={() => controller.current?.abort()}>{text.cancel}</Button> : null}
                <Typography variant="caption" role="status" aria-live="polite">
                    {progress ? `${progress} ${text.progress}` : ''}
                </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{mt: 1}}>
                {text.note}
            </Typography>
            {failed ? (
                <Alert severity="error" sx={{mt: 1}}>
                    {text.failed}
                </Alert>
            ) : null}
        </Box>
    );
};
