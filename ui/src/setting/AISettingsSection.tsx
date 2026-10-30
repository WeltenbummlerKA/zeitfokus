import * as React from 'react';
import {useMutation, useQuery} from '@apollo/client';
import {Alert, Box, Button, MenuItem, Stack, TextField, Typography} from '@mui/material';
import {AISettings, SetAISettings} from '../gql/aiSettings';
import {CurrentUser} from '../gql/user';
import {AISettingsQuery, CurrentUserQuery, InputAISettings, SetAISettingsMutation, SetAISettingsMutationVariables} from '../gql/__generated__';
import {useI18n} from '../i18n';

const labels = {
    de: {
        title: 'KI-Auswertung', provider: 'Anbieter', disabled: 'Deaktiviert', endpoint: 'Serveradresse', model: 'Modell',
        timeout: 'Zeitlimit (Sekunden)', save: 'KI-Einstellungen speichern', saving: 'Wird gespeichert…',
        saved: 'KI-Einstellungen gespeichert.', error: 'Speichern fehlgeschlagen. Prüfe Serveradresse und Modell und versuche es erneut.',
        loadError: 'Die KI-Einstellungen konnten nicht geladen werden.', retry: 'Erneut laden', loading: 'KI-Einstellungen werden geladen…',
        help: 'Diese Einstellung gilt für die gesamte Instanz und wird auf dem Zeitfokus-Server gespeichert. Sie ersetzt die Vorgabe aus dem Stack.',
        privacy: 'Erst beim Start einer KI-Auswertung werden Zeit-Summen und Tags an den gewählten Server gesendet. Notizen werden nicht übertragen. KI-Ergebnisse können Fehler enthalten.',
        addressHelp: 'Lokale HTTP-Adresse, vom Zeitfokus-Container erreichbar. localhost bezeichnet den Container selbst. Keine Zugangsdaten in der Adresse.',
        modelHelp: 'Exakten Namen eines auf diesem Server verfügbaren Modells eingeben.',
        inactive: 'Deaktiviert: Es werden keine KI-Anfragen gesendet. Die Zeiterfassung bleibt verfügbar.',
        admin: 'Die gemeinsame KI-Verbindung kann nur von einem Administratorkonto geändert werden.',
    },
    en: {
        title: 'AI analysis', provider: 'Provider', disabled: 'Disabled', endpoint: 'Server address', model: 'Model',
        timeout: 'Timeout (seconds)', save: 'Save AI settings', saving: 'Saving…',
        saved: 'AI settings saved.', error: 'Could not save. Check the server address and model, then retry.',
        loadError: 'AI settings could not be loaded.', retry: 'Reload', loading: 'Loading AI settings…',
        help: 'This setting applies to the entire instance and is stored on the Zeitfokus server. It overrides the stack default.',
        privacy: 'Only starting an AI analysis sends time totals and tags to the selected server. Notes are excluded. AI results may contain errors.',
        addressHelp: 'Local HTTP address reachable from the Zeitfokus container. localhost refers to the container itself. Do not include credentials.',
        modelHelp: 'Enter the exact name of a model available on this server.',
        inactive: 'Disabled: no AI requests are sent. Time tracking remains available.',
        admin: 'Only an administrator can change the shared AI connection.',
    },
};

const initial: InputAISettings = {provider: 'disabled', baseURL: '', model: '', timeoutSeconds: 60};

export const AISettingsSection: React.FC = () => {
    const {language} = useI18n();
    const text = labels[language];
    const user = useQuery<CurrentUserQuery>(CurrentUser);
    return (
        <Box component="section" sx={{mt: 3, mb: 3}} aria-labelledby="ai-settings-title">
            <Typography id="ai-settings-title" component="h2" variant="h6" gutterBottom>{text.title}</Typography>
            {user.data?.user?.admin ? <AISettingsForm /> : <Typography variant="body2" color="text.secondary">{text.admin}</Typography>}
        </Box>
    );
};

const AISettingsForm: React.FC = () => {
    const {language} = useI18n();
    const text = labels[language];
    const query = useQuery<AISettingsQuery>(AISettings, {fetchPolicy: 'network-only'});
    const [save, {loading: saving}] = useMutation<SetAISettingsMutation, SetAISettingsMutationVariables>(SetAISettings);
    const [draft, setDraft] = React.useState<InputAISettings>(initial);
    const [status, setStatus] = React.useState<'saved' | 'error' | null>(null);
    React.useEffect(() => {
        const settings = query.data?.aiSettings;
        if (settings) {
            setDraft({provider: settings.provider, baseURL: settings.baseURL, model: settings.model, timeoutSeconds: settings.timeoutSeconds});
        }
    }, [query.data]);
    const change = (patch: Partial<InputAISettings>) => {
        setStatus(null);
        setDraft((previous) => ({...previous, ...patch}));
    };
    const active = draft.provider !== 'disabled';
    const valid = Number.isInteger(draft.timeoutSeconds) && draft.timeoutSeconds >= 1 && draft.timeoutSeconds <= 120 &&
        (!active || (draft.baseURL.trim().startsWith('http://') && draft.model.trim().length > 0));
    const busy = query.loading || saving;
    if (query.loading) {
        return <Typography role="status">{text.loading}</Typography>;
    }
    if (query.error || !query.data) {
        return <Alert severity="error" action={<Button color="inherit" onClick={() => { void query.refetch().catch(() => {}); }}>{text.retry}</Button>}>{text.loadError}</Alert>;
    }
    return (
        <Box component="form" onSubmit={(event) => {
            event.preventDefault();
            if (!valid || busy) {
                return;
            }
            setStatus(null);
            void save({variables: {settings: draft}}).then(() => setStatus('saved')).catch(() => setStatus('error'));
        }}>
            <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>{text.help}</Typography>
            <Stack spacing={2}>
                <TextField select fullWidth label={text.provider} value={draft.provider} disabled={busy}
                    onChange={(event) => change({provider: event.target.value})}>
                    <MenuItem value="disabled">{text.disabled}</MenuItem>
                    <MenuItem value="ollama">Ollama</MenuItem>
                    <MenuItem value="lmstudio">LM Studio</MenuItem>
                </TextField>
                {active && <>
                    <TextField fullWidth required label={text.endpoint} value={draft.baseURL} disabled={busy}
                        placeholder={draft.provider === 'ollama' ? 'http://192.168.178.10:11434' : 'http://192.168.178.10:1234/v1'}
                        helperText={text.addressHelp} inputProps={{maxLength: 2048, autoCapitalize: 'none', spellCheck: false}}
                        onChange={(event) => change({baseURL: event.target.value})} />
                    <TextField fullWidth required label={text.model} value={draft.model} disabled={busy}
                        helperText={text.modelHelp} inputProps={{maxLength: 256, autoCapitalize: 'none', spellCheck: false}}
                        onChange={(event) => change({model: event.target.value})} />
                    <TextField fullWidth label={text.timeout} type="number" value={draft.timeoutSeconds} disabled={busy}
                        inputProps={{min: 1, max: 120, step: 1}}
                        onChange={(event) => change({timeoutSeconds: Number(event.target.value)})} />
                </>}
                {!active && <Typography variant="body2" color="text.secondary">{text.inactive}</Typography>}
                <Typography variant="body2" color="text.secondary">{text.privacy}</Typography>
                {status && <Alert severity={status === 'saved' ? 'success' : 'error'}>{text[status]}</Alert>}
                <Button type="submit" variant="contained" disabled={busy || !valid}>{saving ? text.saving : text.save}</Button>
            </Stack>
        </Box>
    );
};
