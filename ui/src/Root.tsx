import * as React from 'react';
import './global.css';
import 'react-resizable/css/styles.css';
import 'react-grid-layout/css/styles.css';
import {ThemeProvider} from './provider/ThemeProvider';
import {ApolloProvider} from './provider/ApolloProvider';
import {SnackbarProvider} from './provider/SnackbarProvider';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment';
import {Router} from './Router';
import {HashRouter} from 'react-router-dom';
import {BootUserSettings} from './provider/UserSettingsProvider';
import {useI18n} from './i18n';
import {deDE, enUS} from '@mui/x-date-pickers/locales';

export const Root = () => {
    const {language} = useI18n();
    return (
        <ApolloProvider>
            <BootUserSettings>
                <ThemeProvider>
                    <LocalizationProvider
                        dateAdapter={AdapterMoment}
                        adapterLocale={language}
                        localeText={(language === 'de' ? deDE : enUS).components.MuiLocalizationProvider.defaultProps.localeText}>
                        <SnackbarProvider>
                            <HashRouter>
                                <Router />
                            </HashRouter>
                        </SnackbarProvider>
                    </LocalizationProvider>
                </ThemeProvider>
            </BootUserSettings>
        </ApolloProvider>
    );
};
