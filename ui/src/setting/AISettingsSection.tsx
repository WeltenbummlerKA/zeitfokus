import * as React from 'react';
import {useMutation, useQuery} from '@apollo/client';
import {Alert, Box, Button, Stack, TextField, Typography} from '@mui/material';
import {AISettings, SetAISettings} from '../gql/aiSettings';
import {CurrentUser} from '../gql/user';
import {
    AiSettingsQuery,
    CurrentUserQuery,
    InputAiSettings,
    SetAiSettingsMutation,
    SetAiSettingsMutationVariables,
} from '../gql/__generated__';
import {useI18n} from '../i18n';
import {SettingsPanel} from './SettingsPanel';

const labels = {
    de: {
        title: 'KI-Auswertung',
        provider: 'Anbieter',
        disabled: 'Deaktiviert',
        endpoint: 'Serveradresse',
        model: 'Modell',
        timeout: 'Zeitlimit (Sekunden)',
        save: 'KI-Einstellungen speichern',
        saving: 'Wird gespeichert…',
        saved: 'KI-Einstellungen gespeichert.',
        error: 'Speichern fehlgeschlagen. Prüfe Serveradresse und Modell und versuche es erneut.',
        loadError: 'Die KI-Einstellungen konnten nicht geladen werden.',
        retry: 'Erneut laden',
        loading: 'KI-Einstellungen werden geladen…',
        help: 'Gilt für alle Konten. Die Verbindung wird dauerhaft auf deinem Zeitfokus-Server gespeichert.',
        privacyTitle: 'Welche Daten werden übertragen?',
        privacy:
            'Erst beim Start einer KI-Auswertung werden Zeit-Summen und Tags an den gewählten Server gesendet. Notizen werden nicht übertragen. KI-Ergebnisse können Fehler enthalten.',
        addressHelp:
            'Lokale HTTP-Adresse, vom Zeitfokus-Container erreichbar. localhost bezeichnet den Container selbst. Keine Zugangsdaten in der Adresse.',
        modelHelp: 'Exakten Namen eines auf diesem Server verfügbaren Modells eingeben.',
        inactive: 'Keine Verbindung aktiv. Deine Zeiterfassung funktioniert ohne KI.',
        admin: 'Die gemeinsame KI-Verbindung kann nur von einem Administratorkonto geändert werden.',
    },
    en: {
        title: 'AI analysis',
        provider: 'Provider',
        disabled: 'Disabled',
        endpoint: 'Server address',
        model: 'Model',
        timeout: 'Timeout (seconds)',
        save: 'Save AI settings',
        saving: 'Saving…',
        saved: 'AI settings saved.',
        error: 'Could not save. Check the server address and model, then retry.',
        loadError: 'AI settings could not be loaded.',
        retry: 'Reload',
        loading: 'Loading AI settings…',
        help: 'Applies to all accounts. The connection is stored on your Zeitfokus server.',
        privacyTitle: 'What data is sent?',
        privacy:
            'Only starting an AI analysis sends time totals and tags to the selected server. Notes are excluded. AI results may contain errors.',
        addressHelp:
            'Local HTTP address reachable from the Zeitfokus container. localhost refers to the container itself. Do not include credentials.',
        modelHelp: 'Enter the exact name of a model available on this server.',
        inactive: 'No active connection. Time tracking works without AI.',
        admin: 'Only an administrator can change the shared AI connection.',
    },
};

// The server accepts private-network HTTP endpoints only; the browser never contacts them.
// eslint-disable-next-line sonarjs/no-clear-text-protocols
const endpointExamples = {ollama: 'http://192.168.178.10:11434', lmstudio: 'http://192.168.178.10:1234/v1'};

const initial: InputAiSettings = {provider: 'disabled', baseURL: '', model: '', timeoutSeconds: 60};

export const AISettingsSection: React.FC = () => {
    const {language} = useI18n();
    const text = labels[language];
    const user = useQuery<CurrentUserQuery>(CurrentUser);
    return (
        <SettingsPanel id="ai-settings-title" title={text.title} description={text.help} badge="Administration">
            {user.data?.user?.admin ? (
                <AISettingsForm />
            ) : (
                <Typography variant="body2" color="text.secondary">
                    {text.admin}
                </Typography>
            )}
        </SettingsPanel>
    );
};

const AISettingsForm: React.FC = () => {
    const {language} = useI18n();
    const text = labels[language];
    const query = useQuery<AiSettingsQuery>(AISettings, {fetchPolicy: 'network-only'});
    const [save, {loading: saving}] = useMutation<SetAiSettingsMutation, SetAiSettingsMutationVariables>(SetAISettings);
    const [draft, setDraft] = React.useState<InputAiSettings>(initial);
    const [storedDraft, setStoredDraft] = React.useState<InputAiSettings>(initial);
    const [status, setStatus] = React.useState<'saved' | 'error' | null>(null);
    React.useEffect(() => {
        const settings = query.data?.aiSettings;
        if (settings) {
            const next = {
                provider: settings.provider,
                baseURL: settings.baseURL,
                model: settings.model,
                timeoutSeconds: settings.timeoutSeconds,
            };
            setDraft(next);
            setStoredDraft(next);
        }
    }, [query.data]);
    const change = (patch: Partial<InputAiSettings>) => {
        setStatus(null);
        setDraft((previous) => ({...previous, ...patch}));
    };
    const active = draft.provider !== 'disabled';
    const valid =
        Number.isInteger(draft.timeoutSeconds) &&
        draft.timeoutSeconds >= 1 &&
        draft.timeoutSeconds <= 120 &&
        (!active || (draft.baseURL.trim().startsWith('http://') && draft.model.trim().length > 0));
    const busy = query.loading || saving;
    const changed = JSON.stringify(draft) !== JSON.stringify(storedDraft);
    if (query.loading) {
        return <Typography role="status">{text.loading}</Typography>;
    }
    if (query.error || !query.data) {
        return (
            <Alert
                severity="error"
                action={
                    <Button
                        color="inherit"
                        onClick={() => {
                            void query.refetch().catch(() => {});
                        }}>
                        {text.retry}
                    </Button>
                }>
                {text.loadError}
            </Alert>
        );
    }
    return (
        <Box
            component="form"
            onSubmit={(event) => {
                event.preventDefault();
                if (!valid || busy || !changed) {
                    return;
                }
                setStatus(null);
                void save({variables: {settings: draft}})
                    .then((result) => {
                        const stored = result.data?.setAISettings;
                        if (stored) {
                            const next = {
                                provider: stored.provider,
                                baseURL: stored.baseURL,
                                model: stored.model,
                                timeoutSeconds: stored.timeoutSeconds,
                            };
                            setDraft(next);
                            setStoredDraft(next);
                        }
                        setStatus('saved');
                    })
                    .catch(() => setStatus('error'));
            }}>
            <Stack spacing={2}>
                <TextField
                    select
                    SelectProps={{native: true}}
                    fullWidth
                    label={text.provider}
                    value={draft.provider}
                    disabled={busy}
                    onChange={(event) => change({provider: event.target.value})}>
                    <option value="disabled">{text.disabled}</option>
                    <option value="ollama">Ollama</option>
                    <option value="lmstudio">LM Studio</option>
                </TextField>
                {active && (
                    <>
                        <TextField
                            fullWidth
                            required
                            label={text.endpoint}
                            value={draft.baseURL}
                            disabled={busy}
                            placeholder={draft.provider === 'ollama' ? endpointExamples.ollama : endpointExamples.lmstudio}
                            helperText={text.addressHelp}
                            inputProps={{maxLength: 2048, autoCapitalize: 'none', spellCheck: false}}
                            onChange={(event) => change({baseURL: event.target.value})}
                        />
                        <TextField
                            fullWidth
                            required
                            label={text.model}
                            value={draft.model}
                            disabled={busy}
                            helperText={text.modelHelp}
                            inputProps={{maxLength: 256, autoCapitalize: 'none', spellCheck: false}}
                            onChange={(event) => change({model: event.target.value})}
                        />
                        <TextField
                            fullWidth
                            label={text.timeout}
                            type="number"
                            value={draft.timeoutSeconds}
                            disabled={busy}
                            inputProps={{min: 1, max: 120, step: 1}}
                            onChange={(event) => change({timeoutSeconds: Number(event.target.value)})}
                        />
                    </>
                )}
                {!active && (
                    <Typography variant="body2" color="text.secondary">
                        {text.inactive}
                    </Typography>
                )}
                <Box
                    component="details"
                    sx={{
                        color: 'text.secondary',
                        typography: 'body2',
                        '& summary': {cursor: 'pointer', py: 1},
                        '& summary:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 4,
                            borderRadius: 1,
                        },
                    }}>
                    <summary>{text.privacyTitle}</summary>
                    <Typography variant="body2" sx={{mt: 1}}>
                        {text.privacy}
                    </Typography>
                </Box>
                {status && <Alert severity={status === 'saved' ? 'success' : 'error'}>{text[status]}</Alert>}
                <Button
                    type="submit"
                    variant="contained"
                    disabled={busy || !valid || !changed}
                    sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}}}>
                    {saving ? text.saving : text.save}
                </Button>
            </Stack>
        </Box>
    );
};
