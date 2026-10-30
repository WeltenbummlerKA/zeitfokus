import * as React from 'react';
import {useMutation} from '@apollo/client';
import {Alert, Box, Button, Checkbox, FormControlLabel, FormGroup, Stack, Switch, TextField, Typography} from '@mui/material';
import {useI18n} from '../i18n';
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
        help: 'Dein Wochenziel wird gleichmäßig auf die gewählten Arbeitstage verteilt. Die Auswertung dient als persönliche Orientierung; Feiertage und Abwesenheiten werden nicht automatisch berücksichtigt.',
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
        help: 'Your weekly target is divided equally across the selected work days. This is a personal guide; public holidays and absences are not adjusted automatically.',
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
    const numericHours = Number(hours);
    const validHours = hours.trim() !== '' && Number.isFinite(numericHours) && numericHours >= 0 && numericHours <= 168;
    const valid = validHours && (!draft.enabled || (numericHours > 0 && draft.workDays.length > 0));
    return (
        <Box
            component="form"
            onSubmit={(event) => {
                event.preventDefault();
                if (!valid || loading) {
                    return;
                }
                setStatus(null);
                void save({variables: {profile: {...draft, weeklyHours: numericHours}}})
                    .then(() => setStatus('saved'))
                    .catch(() => setStatus('error'));
            }}
            sx={{mt: 4, pt: 3, borderTop: 1, borderColor: 'divider'}}>
            <Typography component="h2" variant="h6" gutterBottom>
                {text.title}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{mb: 2}}>
                {text.help}
            </Typography>
            <FormControlLabel
                label={text.enabled}
                control={
                    <Switch
                        checked={draft.enabled}
                        disabled={!settings.done || loading}
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
                <TextField
                    label={text.weekly}
                    value={hours}
                    type="number"
                    disabled={!settings.done || loading || !draft.enabled}
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
                    <FormGroup>
                        {days.map((day, index) => (
                            <FormControlLabel
                                key={day}
                                label={text.weekday[index]}
                                control={
                                    <Checkbox
                                        disabled={!settings.done || loading || !draft.enabled}
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
                {!valid && <Alert severity="warning">{text.invalid}</Alert>}
                {status && <Alert severity={status === 'saved' ? 'success' : 'error'}>{text[status]}</Alert>}
                <Button type="submit" variant="contained" disabled={!settings.done || loading || !valid}>
                    {text.save}
                </Button>
            </Stack>
        </Box>
    );
};
