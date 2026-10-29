import * as React from 'react';
import {Box, Typography, Link} from '@mui/material';
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
                    Zeitstrahl
                </Typography>
                <Typography color="text.secondary" sx={{mb: 3}}>
                    {t('Your time, clearly organised.')}
                </Typography>
                <LoginForm />
            </DefaultPaper>
            <Box component="footer" sx={{display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center'}}>
                <Link href="https://github.com/traggo/server">{t('Source Code')}</Link>
                <Link href="https://github.com/traggo/server/issues">{t('Bug Tracker')}</Link>
            </Box>
        </Box>
    );
};
