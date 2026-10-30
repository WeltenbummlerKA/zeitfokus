import * as React from 'react';
import {Alert, Box, Typography, Link} from '@mui/material';
import {LoginForm} from './LoginForm';
import {DefaultPaper} from '../common/DefaultPaper';
import {LanguageSwitcher} from '../i18n/LanguageSwitcher';
import {t, useI18n} from '../i18n';
export const LoginPage = () => {
    useI18n();
    return (
        <Box className="login-layout">
            <Box sx={{alignSelf: 'flex-end'}}>
                <LanguageSwitcher />
            </Box>
            <DefaultPaper>
                <Typography variant="h1" component="h1" gutterBottom>
                    Zeitfokus
                </Typography>
                <Typography color="text.secondary" sx={{mb: 3}}>
                    {t('Your time, clearly organised.')}
                </Typography>
                <LoginForm />
                <Alert severity="info" sx={{mt: 3, textAlign: 'left'}}>
                    {t('First start password hint')}
                </Alert>
            </DefaultPaper>
            <Box component="footer" sx={{display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center'}}>
                <Link href="https://github.com/WeltenbummlerKA/zeitfokus">{t('Source Code')}</Link>
                <Link href="https://github.com/WeltenbummlerKA/zeitfokus/issues">{t('Bug Tracker')}</Link>
            </Box>
        </Box>
    );
};
