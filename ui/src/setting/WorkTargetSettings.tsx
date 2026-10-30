import * as React from 'react';
import {useMutation} from '@apollo/client';
import {Alert, Box, Button, Checkbox, FormControlLabel, FormGroup, Stack, Switch, TextField, Typography} from '@mui/material';
import {useI18n} from '../i18n';
import {SettingsPanel} from './SettingsPanel';
import {
    InputWorkTargetProfile,
    SetWorkTargetProfileMutation,
    SetWorkTargetProfileMutationVariables,
    WeekDay,
} from '../gql/__generated__';
import {SetWorkTargetProfile, Settings, useSettings} from '../gql/settings';

const days = [
    WeekDay.Monday,
    WeekDay.Tuesday,
    WeekDay.Wednesday,
    WeekDay.Thursday,
    WeekDay.Friday,
    WeekDay.Saturday,
    WeekDay.Sunday,
];
const defaultProfile: InputWorkTargetProfile = {enabled: false, weeklyHours: 40, workDays: days.slice(0, 5)};
const labels = {
    de: {
        title: 'Soll-/Ist-Auswertung',
        enabled: 'Soll-/Ist-Auswertung aktivieren',
        weekly: 'Wochenziel (Stunden)',
        days: 'Arbeitstage',
        save: 'Profil speichern',
        saved: 'Arbeitszeitprofil gespeichert.',
        error: 'Das Profil konnte nicht gespeichert werden. Bitte erneut versuchen.',
        help: 'Vergleiche deine erfasste Zeit mit deinem persönlichen Wochenziel.',
        details:
            'Das Ziel wird gleichmäßig auf die Arbeitstage verteilt. Feiertage und Abwesenheiten werden nicht automatisch berücksichtigt.',
        note: 'Hinweise zur Berechnung',
        disabled: 'Deaktiviert: Sollwerte und Vergleiche werden ausgeblendet. Dein gespeichertes Profil bleibt erhalten.',
        invalid: 'Wähle mindestens einen Arbeitstag und ein Wochenziel größer als 0 bis höchstens 168 Stunden.',
        weekday: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    },
    en: {
        title: 'Target/actual comparison',
        enabled: 'Enable target/actual comparison',
        weekly: 'Weekly target (hours)',
        days: 'Work days',
        save: 'Save profile',
        saved: 'Work target profile saved.',
        error: 'The profile could not be saved. Please retry.',
        help: 'Compare your tracked time with your personal weekly target.',
        details: 'The target is divided equally across work days. Public holidays and absences are not adjusted automatically.',
        note: 'About the calculation',
        disabled: 'Disabled: targets and comparisons are hidden. Your saved profile is retained.',
        invalid: 'Choose at least one work day and a weekly target greater than 0 and no more than 168 hours.',
        weekday: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
};

export const WorkTargetSettings: React.FC = () => {
    const {language} = useI18n();
    const text = labels[language];
    const settings = useSettings();
    const stored = settings.workTargetProfile;
    const [draft, setDraft] = React.useState<InputWorkTargetProfile>(defaultProfile);
    const [hours, setHours] = React.useState('40');
    const [status, setStatus] = React.useState<'saved' | 'error' | null>(null);
    React.useEffect(() => {
        if (!settings.done) {
            return;
        }
        const next = stored
            ? {enabled: stored.enabled, weeklyHours: stored.weeklyHours, workDays: [...stored.workDays]}
            : defaultProfile;
        setDraft(next);
        setHours(String(next.weeklyHours));
    }, [settings.done, stored]);
    const [save, {loading}] = useMutation<SetWorkTargetProfileMutation, SetWorkTargetProfileMutationVariables>(
        SetWorkTargetProfile,
        {
            refetchQueries: [{query: Settings}],
            awaitRefetchQueries: true,
        }
    );
    const original = stored ?? defaultProfile;
    const busy = !settings.done || loading;
    const numericHours = Number(hours);
    const validHours = hours.trim() !== '' && Number.isFinite(numericHours) && numericHours >= 0 && numericHours <= 168;
    const valid = !draft.enabled || (validHours && numericHours > 0 && draft.workDays.length > 0);
    const changed =
        draft.enabled !== original.enabled ||
        numericHours !== original.weeklyHours ||
        days.some((day) => draft.workDays.includes(day) !== original.workDays.includes(day));
    return (
        <SettingsPanel id="work-target-settings-title" title={text.title} description={text.help}>
            <Box
                component="form"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!valid || busy || !changed) {
                        return;
                    }
                    setStatus(null);
                    void save({variables: {profile: {...draft, weeklyHours: validHours ? numericHours : original.weeklyHours}}})
                        .then(() => setStatus('saved'))
                        .catch(() => setStatus('error'));
                }}>
                <FormControlLabel
                    label={text.enabled}
                    control={
                        <Switch
                            checked={draft.enabled}
                            disabled={busy}
                            onChange={(_, enabled) => {
                                setStatus(null);
                                setDraft((previous) => ({...previous, enabled}));
                            }}
                        />
                    }
                />
                {!draft.enabled && (
                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                        {text.disabled}
                    </Typography>
                )}
                <Stack spacing={2} sx={{mt: 2}}>
                    {draft.enabled && (
                        <>
                            <TextField
                                label={text.weekly}
                                value={hours}
                                type="number"
                                disabled={busy}
                                inputProps={{min: 0, max: 168, step: 0.25}}
                                error={!validHours}
                                onChange={(event) => {
                                    setStatus(null);
                                    setHours(event.target.value);
                                }}
                            />
                            <Box component="fieldset" sx={{m: 0, p: 2, border: 1, borderColor: 'divider', borderRadius: 2}}>
                                <Typography component="legend" variant="body2">
                                    {text.days}
                                </Typography>
                                <FormGroup
                                    sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))'}}}>
                                    {days.map((day, index) => (
                                        <FormControlLabel
                                            key={day}
                                            label={text.weekday[index]}
                                            control={
                                                <Checkbox
                                                    disabled={busy}
                                                    checked={draft.workDays.includes(day)}
                                                    onChange={(_, checked) => {
                                                        setStatus(null);
                                                        setDraft((previous) => ({
                                                            ...previous,
                                                            workDays: checked
                                                                ? [...previous.workDays, day]
                                                                : previous.workDays.filter((value) => value !== day),
                                                        }));
                                                    }}
                                                />
                                            }
                                        />
                                    ))}
                                </FormGroup>
                            </Box>
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
                                <summary>{text.note}</summary>
                                <Typography variant="body2" sx={{mt: 1}}>
                                    {text.details}
                                </Typography>
                            </Box>
                        </>
                    )}
                    {!valid && <Alert severity="warning">{text.invalid}</Alert>}
                    {status && <Alert severity={status === 'saved' ? 'success' : 'error'}>{text[status]}</Alert>}
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={busy || !valid || !changed}
                        sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}}}>
                        {text.save}
                    </Button>
                </Stack>
            </Box>
        </SettingsPanel>
    );
};
