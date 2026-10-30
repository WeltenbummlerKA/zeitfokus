import * as React from 'react';
import {useMutation, useQuery} from '@apollo/client';
import {Alert, Box, Button, Chip, LinearProgress, Paper, Stack, TextField, Typography} from '@mui/material';
import {Link as RouterLink} from 'react-router-dom';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import moment from 'moment';
import {AIStatus, AnalyzeTimeReport} from '../gql/aiAnalysis';
import {CurrentUser} from '../gql/user';
import {
    AiStatusQuery,
    AnalyzeTimeReportMutation,
    AnalyzeTimeReportMutationVariables,
    CurrentUserQuery,
} from '../gql/__generated__';
import {useI18n} from '../i18n';
import {formatHistoryDuration} from '../timespan/historyFilterUtils';
import {analysisRange} from './analysisRange';

const labels = {
    de: {
        title: 'Deine Arbeitszeit, eingeordnet.',
        intro: 'Lass dir einen Zeitraum zusammenfassen. Du entscheidest, wann die Auswertung startet.',
        period: 'Zeitraum wählen',
        from: 'Von',
        to: 'Bis einschließlich',
        today: 'Heute',
        week: 'Letzte 7 Tage',
        month: 'Dieser Monat',
        start: 'Mit KI auswerten',
        loading: 'Deine Arbeitszeit wird ausgewertet …',
        privacy: 'Übertragen werden nur Zeit-Summen und Tags deines Kontos. Notizen bleiben ausgeschlossen.',
        result: 'Deine Auswertung',
        empty: 'Wähle einen Zeitraum und starte die Auswertung. Hier erscheint anschließend die Zusammenfassung.',
        failed: 'Die Auswertung ist fehlgeschlagen. Prüfe, ob der Modellserver erreichbar und das gewählte Modell verfügbar ist, und versuche es erneut.',
        disabled:
            'KI ist noch nicht eingerichtet oder deaktiviert. Ein Administrator kann Ollama oder LM Studio in den Einstellungen verbinden.',
        configure: 'KI-Verbindung einrichten',
        settings: 'KI-Einstellungen',
        statusError: 'Der KI-Status konnte nicht geladen werden.',
        retry: 'Erneut laden',
        configured: 'Konfiguriert',
        off: 'Deaktiviert',
        invalid: 'Wähle einen gültigen Zeitraum. Das Enddatum darf nicht vor dem Beginn liegen.',
        total: 'Erfasste Zeit',
        entries: 'Abgeschlossene Einträge',
        days: 'Tage mit Einträgen',
        note: 'KI-generierte Zusammenfassung. Prüfe das Ergebnis; deine Einträge werden nicht verändert.',
        help: 'Hilfe zur KI',
    },
    en: {
        title: 'Make sense of your working time.',
        intro: 'Get a summary of a selected period. You decide when analysis starts.',
        period: 'Choose a period',
        from: 'From',
        to: 'To (inclusive)',
        today: 'Today',
        week: 'Last 7 days',
        month: 'This month',
        start: 'Analyze with AI',
        loading: 'Analyzing your working time …',
        privacy: 'Only your account’s time totals and tags are sent. Notes are excluded.',
        result: 'Your analysis',
        empty: 'Choose a period and start analysis. Your summary will appear here.',
        failed: 'Analysis failed. Check that the model server is reachable and the selected model is available, then retry.',
        disabled: 'AI is not configured or is disabled. An administrator can connect Ollama or LM Studio in Settings.',
        configure: 'Set up AI connection',
        settings: 'AI settings',
        statusError: 'Could not load AI status.',
        retry: 'Reload',
        configured: 'Configured',
        off: 'Disabled',
        invalid: 'Choose a valid period. The end date must not be earlier than the start.',
        total: 'Tracked time',
        entries: 'Completed entries',
        days: 'Days with entries',
        note: 'AI-generated summary. Check the result; your entries are never changed.',
        help: 'AI help',
    },
};
type Report = {data: AnalyzeTimeReportMutation['analyzeTimeReport']; from: string; to: string};

export const AIPage: React.FC = () => {
    const {language} = useI18n();
    const text = labels[language];
    const status = useQuery<AiStatusQuery>(AIStatus, {fetchPolicy: 'network-only'});
    const user = useQuery<CurrentUserQuery>(CurrentUser);
    const [analyze, {loading}] = useMutation<AnalyzeTimeReportMutation, AnalyzeTimeReportMutationVariables>(AnalyzeTimeReport);
    const [from, setFrom] = React.useState(() => moment().startOf('month').format('YYYY-MM-DD'));
    const [to, setTo] = React.useState(() => moment().format('YYYY-MM-DD'));
    const [report, setReport] = React.useState<Report | null>(null);
    const [failed, setFailed] = React.useState(false);
    const range = analysisRange(from, to);
    const enabled = !!status.data?.aiStatus.enabled && !status.error;
    const setDates = (nextFrom: string, nextTo: string) => {
        setFrom(nextFrom);
        setTo(nextTo);
        setReport(null);
        setFailed(false);
    };
    const submit = () => {
        if (!range || !enabled || loading) {
            return;
        }
        setFailed(false);
        setReport(null);
        void analyze({variables: {input: range}})
            .then((result) => {
                if (result.data) {
                    setReport({data: result.data.analyzeTimeReport, from, to});
                }
            })
            .catch(() => setFailed(true));
    };
    return (
        <Box sx={{width: '100%', minWidth: 0}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 2, mb: 3}}>
                <Box>
                    <Typography component="h2" variant="h3" gutterBottom>
                        {text.title}
                    </Typography>
                    <Typography color="text.secondary">{text.intro}</Typography>
                </Box>
            </Box>
            {status.loading && <LinearProgress aria-label={text.loading} sx={{mb: 2}} />}
            {status.error && (
                <Alert
                    severity="error"
                    sx={{mb: 2}}
                    action={
                        <Button
                            color="inherit"
                            onClick={() => {
                                void status.refetch().catch(() => {});
                            }}>
                            {text.retry}
                        </Button>
                    }>
                    {text.statusError}
                </Alert>
            )}
            {!status.loading && !status.error && !enabled && (
                <Alert severity="info" sx={{mb: 3}}>
                    {text.disabled}
                </Alert>
            )}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: 'minmax(0, 1fr)', lg: 'minmax(0, 360px) minmax(0, 1fr)'},
                    gap: 3,
                    alignItems: 'start',
                }}>
                <Paper
                    component="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                    sx={{p: 3}}>
                    <Stack spacing={2.5}>
                        <Typography component="h3" variant="h6">
                            {text.period}
                        </Typography>
                        <Stack direction="row" sx={{gap: 0.5, flexWrap: 'wrap'}}>
                            {[text.today, text.week, text.month].map((label, index) => (
                                <Button
                                    key={label}
                                    size="small"
                                    variant="outlined"
                                    disabled={loading}
                                    onClick={() => {
                                        const start = [moment(), moment().subtract(6, 'days'), moment().startOf('month')][index];
                                        setDates(start.format('YYYY-MM-DD'), moment().format('YYYY-MM-DD'));
                                    }}>
                                    {label}
                                </Button>
                            ))}
                        </Stack>
                        <TextField
                            type="date"
                            label={text.from}
                            value={from}
                            disabled={loading}
                            InputLabelProps={{shrink: true}}
                            onChange={(event) => setDates(event.target.value, to)}
                        />
                        <TextField
                            type="date"
                            label={text.to}
                            value={to}
                            disabled={loading}
                            InputLabelProps={{shrink: true}}
                            onChange={(event) => setDates(from, event.target.value)}
                        />
                        {!range && <Alert severity="warning">{text.invalid}</Alert>}
                        <Typography variant="body2" color="text.secondary">
                            {text.privacy}
                        </Typography>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<AutoAwesomeOutlined />}
                            disabled={!enabled || !range || loading || status.loading}>
                            {loading ? text.loading : text.start}
                        </Button>
                        {!status.loading && status.data && (
                            <Chip variant="outlined" label={configurationLabel(status.data, text)} />
                        )}
                        {user.data?.user?.admin && (
                            <Button component={RouterLink} to="/user/settings#ai-settings-title" startIcon={<SettingsOutlined />}>
                                {enabled ? text.settings : text.configure}
                            </Button>
                        )}
                    </Stack>
                </Paper>
                <ReportPanel loading={loading} failed={failed} report={report} text={text} />
            </Box>
        </Box>
    );
};

const ReportPanel: React.FC<{loading: boolean; failed: boolean; report: Report | null; text: typeof labels.de}> = ({
    loading,
    failed,
    report,
    text,
}) => (
    <Paper component="section" aria-labelledby="ai-result-title" sx={{p: {xs: 2, sm: 3}, minWidth: 0, minHeight: 300}}>
        <Typography id="ai-result-title" component="h3" variant="h6" gutterBottom>
            {text.result}
        </Typography>
        {loading && (
            <Box role="status">
                <Typography color="text.secondary" sx={{mb: 2}}>
                    {text.loading}
                </Typography>
                <LinearProgress />
            </Box>
        )}
        {failed && <Alert severity="error">{text.failed}</Alert>}
        {!loading && !failed && !report && (
            <Typography color="text.secondary" sx={{mt: 3, maxWidth: '75ch'}}>
                {text.empty}
            </Typography>
        )}
        {report && (
            <Stack spacing={3}>
                <Typography variant="body2" color="text.secondary">
                    {moment(report.from).format('LL')} – {moment(report.to).format('LL')}
                </Typography>
                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))'}, gap: 2}}>
                    {[
                        [text.total, formatHistoryDuration(report.data.totalSeconds)],
                        [text.entries, report.data.completedEntries],
                        [text.days, report.data.daysWithActivity],
                    ].map(([label, value]) => (
                        <Box key={label}>
                            <Typography variant="h5">{value}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Typography sx={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxWidth: '85ch'}}>
                    {report.data.text}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {text.note}
                </Typography>
            </Stack>
        )}
    </Paper>
);

const configurationLabel = (status: AiStatusQuery | undefined, text: typeof labels.de) => {
    const provider = status?.aiStatus.provider === 'ollama' ? 'Ollama' : 'LM Studio';
    return status?.aiStatus.enabled ? `${text.configured}: ${provider}` : text.off;
};
