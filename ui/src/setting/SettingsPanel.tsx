import * as React from 'react';
import {Box, Chip, Paper, Typography} from '@mui/material';

interface SettingsPanelProps extends React.PropsWithChildren {
    id: string;
    title: string;
    description?: string;
    badge?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({id, title, description, badge, children}) => (
    <Paper
        id={`${id}-panel`}
        component="section"
        aria-labelledby={id}
        sx={{p: {xs: 2, sm: 3}, minWidth: 0, scrollMarginTop: 150}}>
        <Box sx={{display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: description ? 1 : 2.5}}>
            <Typography id={id} component="h2" variant="h6" sx={{flexGrow: 1}}>
                {title}
            </Typography>
            {badge && <Chip label={badge} size="small" variant="outlined" />}
        </Box>
        {description && (
            <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                {description}
            </Typography>
        )}
        {children}
    </Paper>
);
