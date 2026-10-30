import {t, useI18n} from '../i18n';
import * as React from 'react';
import {Box, Link, Paper, Typography} from '@mui/material';
import {useQuery} from '@apollo/client';
import * as gqlVersion from '../gql/version';
import {VersionQuery} from '../gql/__generated__';

export const AboutPage: React.FC = () => {
    useI18n();
    const {data} = useQuery<VersionQuery>(gqlVersion.Version);
    const version = data?.version ?? gqlVersion.VersionDefault.version;
    return (
        <Paper sx={{maxWidth: 640, mx: 'auto', p: {xs: 3, sm: 5}, textAlign: 'center', borderRadius: 3}}>
            <Box
                component="img"
                src="/zeitfokus-icon.png"
                alt="Zeitfokus"
                sx={{width: 80, height: 80, imageRendering: 'auto', mb: 2}}
            />
            <Typography component="h2" variant="h4" gutterBottom>
                Zeitfokus
            </Typography>
            <Typography color="text.secondary" sx={{mb: 3}}>
                {t('A focused, private time tracker for your workday.')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {t('Version')} {version.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{mt: 1}}>
                Build {version.commit.slice(0, 8)}
            </Typography>
            <Typography variant="body2" sx={{mt: 2}}>
                <Link href="https://github.com/WeltenbummlerKA/zeitfokus" target="_blank" rel="noreferrer">
                    {t('Source code')}
                </Link>
                {' · '}
                <Link href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noreferrer">
                    GPLv3
                </Link>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{mt: 5}}>
                based on Traggo
            </Typography>
        </Paper>
    );
};
