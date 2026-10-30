import * as React from 'react';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {useMutation} from '@apollo/client';
import {Box, Button, TextField, Typography} from '@mui/material';
import {useSnackbar} from 'notistack';
import {t, useI18n} from '../i18n';
import {LanguageSwitcher} from '../i18n/LanguageSwitcher';
import {SetSettings, Settings, useSettings} from '../gql/settings';
import {
    SetSettingsMutation,
    SetSettingsMutationVariables,
    DateLocale,
    Theme,
    WeekDay,
    DateTimeInputStyle,
    InputUserSettings,
} from '../gql/__generated__';
import {handleError} from '../utils/errors';
import {WorkTargetSettings} from './WorkTargetSettings';
import {AISettingsSection} from './AISettingsSection';
import {SettingsPanel} from './SettingsPanel';

export const SettingsPage: React.FC = () => {
    const {language} = useI18n();
    const location = useLocation();
    React.useEffect(() => {
        const id = location.hash.slice(1);
        if (!id) {
            return;
        }
        const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView?.({block: 'start'}));
        return () => cancelAnimationFrame(frame);
    }, [location.hash]);
    const all = useSettings();
    const {enqueueSnackbar} = useSnackbar();
    const [save, {loading: saving}] = useMutation<SetSettingsMutation, SetSettingsMutationVariables>(SetSettings, {
        awaitRefetchQueries: true,
        refetchQueries: [{query: Settings}],
    });
    const settings: InputUserSettings = {
        theme: all.theme,
        dateLocale: all.dateLocale,
        firstDayOfTheWeek: all.firstDayOfTheWeek,
        dateTimeInputStyle: all.dateTimeInputStyle,
    };
    const change = (patch: Partial<InputUserSettings>, message: string, action: string) => {
        void save({variables: {settings: {...settings, ...patch}}})
            .then(() => enqueueSnackbar(t(message), {variant: 'success'}))
            .catch(handleError(t(action), enqueueSnackbar));
    };
    const disabled = saving || !all.done;
    return (
        <Box sx={{maxWidth: 1200, mx: 'auto', width: '100%'}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3}}>
                <Typography color="text.secondary">
                    {language === 'de'
                        ? 'Richte Zeitfokus für deinen Arbeitsalltag ein.'
                        : 'Set up Zeitfokus for your working day.'}
                </Typography>
                <Button component={RouterLink} to="/help#settings" startIcon={<HelpOutlineIcon />}>
                    {language === 'de' ? 'Hilfe zu Einstellungen' : 'Settings help'}
                </Button>
            </Box>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)'},
                    gap: 3,
                    alignItems: 'start',
                }}>
                <Box sx={{display: 'grid', gap: 3, minWidth: 0}}>
                    <SettingsPanel
                        id="personal-settings-title"
                        title={language === 'de' ? 'Persönliche Einstellungen' : 'Personal settings'}
                        description={
                            language === 'de'
                                ? 'Gilt für dein Konto. Änderungen werden automatisch gespeichert.'
                                : 'Applies to your account. Changes are saved automatically.'
                        }>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))'},
                                gap: 2.5,
                            }}>
                            <LanguageSwitcher formField />
                            <TextField
                                select
                                fullWidth
                                label={t('Theme')}
                                value={settings.theme}
                                disabled={disabled}
                                SelectProps={{native: true}}
                                onChange={(event) => change({theme: event.target.value as Theme}, 'theme changed', 'set theme')}>
                                {Object.values(Theme).map((value) => (
                                    <option key={value} value={value}>
                                        {t(value)}
                                    </option>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label={t('Date Locale')}
                                value={settings.dateLocale}
                                disabled={disabled}
                                SelectProps={{native: true}}
                                onChange={(event) =>
                                    change(
                                        {dateLocale: event.target.value as DateLocale},
                                        'date locale changed',
                                        'set date locale'
                                    )
                                }>
                                {Object.values(DateLocale).map((value) => (
                                    <option key={value} value={value}>
                                        {t(value)}
                                    </option>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label={t('First day of the week')}
                                value={settings.firstDayOfTheWeek}
                                disabled={disabled}
                                SelectProps={{native: true}}
                                onChange={(event) =>
                                    change(
                                        {firstDayOfTheWeek: event.target.value as WeekDay},
                                        'first day of the week changed',
                                        'set first day of the week'
                                    )
                                }>
                                {[
                                    WeekDay.Monday,
                                    WeekDay.Tuesday,
                                    WeekDay.Wednesday,
                                    WeekDay.Thursday,
                                    WeekDay.Friday,
                                    WeekDay.Saturday,
                                    WeekDay.Sunday,
                                ].map((value) => (
                                    <option key={value} value={value}>
                                        {t(value)}
                                    </option>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label={t('Datetime input style')}
                                value={settings.dateTimeInputStyle}
                                disabled={disabled}
                                SelectProps={{native: true}}
                                onChange={(event) =>
                                    change(
                                        {dateTimeInputStyle: event.target.value as DateTimeInputStyle},
                                        'datetime input style changed',
                                        'set datetime input style'
                                    )
                                }>
                                {[DateTimeInputStyle.Fancy, DateTimeInputStyle.Native].map((value) => (
                                    <option key={value} value={value}>
                                        {t(value)}
                                    </option>
                                ))}
                            </TextField>
                        </Box>
                        {settings.theme === Theme.System && (
                            <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                                {t('Theme follows system appearance')}
                            </Typography>
                        )}
                    </SettingsPanel>
                    <WorkTargetSettings />
                </Box>
                <AISettingsSection />
            </Box>
        </Box>
    );
};
