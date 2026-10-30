import {t, useI18n} from '../i18n';
import * as React from 'react';
import {LanguageSwitcher} from '../i18n/LanguageSwitcher';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import {Paper} from '@mui/material';
import {SetSettings as SetSettingsGQL, Settings as SettingsGQL, useSettings} from '../gql/settings';
import {useMutation} from '@apollo/client';
import {
    SetSettingsMutation,
    SetSettingsMutationVariables,
    DateLocale,
    Theme,
    WeekDay,
    DateTimeInputStyle,
} from '../gql/__generated__';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/NativeSelect';
import {useSnackbar} from 'notistack';
import {handleError} from '../utils/errors';
import {WorkTargetSettings} from './WorkTargetSettings';

const useStyles = makeStyles((theme) => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
        },
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(3),
        maxWidth: 500,
        margin: '0 auto',
    },
}));

export const SettingsPage: React.FC = () => {
    useI18n();
    const classes = useStyles();
    const allSettings = useSettings();
    const settings = {
        theme: allSettings.theme,
        dateLocale: allSettings.dateLocale,
        firstDayOfTheWeek: allSettings.firstDayOfTheWeek,
        dateTimeInputStyle: allSettings.dateTimeInputStyle,
    };
    const {enqueueSnackbar} = useSnackbar();
    const [setSettings, {loading: saving}] = useMutation<SetSettingsMutation, SetSettingsMutationVariables>(SetSettingsGQL, {
        awaitRefetchQueries: true,
        refetchQueries: [{query: SettingsGQL}],
    });
    return (
        <Paper elevation={0} className={classes.root}>
            <Typography variant="h6" sx={{mt: 2, mb: 1}}>
                {t('Interface language')}
            </Typography>
            <LanguageSwitcher />
            <FormControl margin={'normal'} fullWidth>
                <InputLabel htmlFor="setting-0">{t('Date Locale')}</InputLabel>
                <Select
                    disabled={saving}
                    inputProps={{id: 'setting-0'}}
                    fullWidth
                    value={settings.dateLocale}
                    onChange={(e) => {
                        setSettings({
                            variables: {
                                settings: {
                                    ...settings,
                                    dateLocale: e.target.value as DateLocale,
                                },
                            },
                        })
                            .then(() => {
                                enqueueSnackbar(t('date locale changed'), {
                                    variant: 'success',
                                });
                            })
                            .catch(handleError(t('set date locale'), enqueueSnackbar));
                    }}>
                    {Object.values(DateLocale).map((type) => (
                        <option key={type} value={type}>
                            {t(type)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl margin={'normal'} fullWidth>
                <InputLabel htmlFor="setting-1">{t('Theme')}</InputLabel>
                <Select
                    disabled={saving}
                    inputProps={{id: 'setting-1'}}
                    fullWidth
                    value={settings.theme}
                    onChange={(e) => {
                        setSettings({variables: {settings: {...settings, theme: e.target.value as Theme}}})
                            .then(() =>
                                enqueueSnackbar(t('theme changed'), {
                                    variant: 'success',
                                })
                            )
                            .catch(handleError(t('set theme'), enqueueSnackbar));
                    }}>
                    {Object.values(Theme).map((type) => (
                        <option key={type} value={type}>
                            {t(type)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                {t('Theme follows system appearance')}
            </Typography>
            <Typography variant="h6" sx={{mt: 3, mb: 1}}>
                {t('AI analysis')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {t('AI analysis is configured by the administrator through ZEITFOKUS_AI_PROVIDER, ZEITFOKUS_AI_BASE_URL and ZEITFOKUS_AI_MODEL. Use a local Ollama or LM Studio endpoint when possible.')}
            </Typography>
            <FormControl margin={'normal'} fullWidth>
                <InputLabel htmlFor="setting-2">{t('First day of the week')}</InputLabel>
                <Select
                    disabled={saving}
                    inputProps={{id: 'setting-2'}}
                    fullWidth
                    value={settings.firstDayOfTheWeek}
                    onChange={(e) => {
                        setSettings({
                            variables: {
                                settings: {
                                    ...settings,
                                    firstDayOfTheWeek: e.target.value as WeekDay,
                                },
                            },
                        })
                            .then(() =>
                                enqueueSnackbar(t('first day of the week changed'), {
                                    variant: 'success',
                                })
                            )
                            .catch(handleError(t('set first day of the week'), enqueueSnackbar));
                    }}>
                    {[
                        WeekDay.Sunday,
                        WeekDay.Monday,
                        WeekDay.Tuesday,
                        WeekDay.Wednesday,
                        WeekDay.Thursday,
                        WeekDay.Friday,
                        WeekDay.Saturday,
                    ].map((type) => (
                        <option key={type} value={type}>
                            {t(type)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl margin={'normal'} fullWidth>
                <InputLabel htmlFor="setting-3">{t('Datetime input style')}</InputLabel>
                <Select
                    disabled={saving}
                    inputProps={{id: 'setting-3'}}
                    fullWidth
                    value={settings.dateTimeInputStyle}
                    onChange={(e) => {
                        setSettings({
                            variables: {
                                settings: {
                                    ...settings,
                                    dateTimeInputStyle: e.target.value as DateTimeInputStyle,
                                },
                            },
                        })
                            .then(() =>
                                enqueueSnackbar(t('datetime input style changed'), {
                                    variant: 'success',
                                })
                            )
                            .catch(handleError(t('set datetime input style'), enqueueSnackbar));
                    }}>
                    {[DateTimeInputStyle.Fancy, DateTimeInputStyle.Native].map((type) => (
                        <option key={type} value={type}>
                            {t(type)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <WorkTargetSettings />
        </Paper>
    );
};
