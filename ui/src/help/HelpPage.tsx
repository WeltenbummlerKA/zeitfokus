import {t, useI18n} from '../i18n';
import * as React from 'react';
import {Accordion, AccordionDetails, AccordionSummary, Alert, Box, Chip, Paper, Stack, Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const topics = [
    {
        title: 'Recording time',
        body: 'Start a timer for the current task or switch to Manual to enter a completed interval. Add a description before saving so the history remains understandable.',
    },
    {
        title: 'Finding and correcting entries',
        body: 'Use the list and calendar views to review your entries. Open the entry menu to edit it explicitly or delete it after confirmation.',
    },
    {
        title: 'Keyboard shortcuts',
        body: 'Ctrl/Cmd + Enter submits the new entry when the tag selector is focused. More shortcuts will be added with the search and filter workspace.',
    },
    {
        title: 'Exports and reports',
        body: 'CSV export, complete-range totals and saved filters are planned for the reporting workspace. Until then, the calendar remains the visual overview.',
    },
    {
        title: 'Privacy and AI analysis',
        body: 'Any future AI analysis will be opt-in, limited to your own time data and configurable for a local or explicitly chosen provider. It will never change entries automatically.',
    },
];

export const HelpPage: React.FC = () => {
    useI18n();
    return (
        <Box sx={{maxWidth: 900, mx: 'auto'}}>
            <Box sx={{mb: 4}}>
                <Typography component="h2" variant="h3" gutterBottom>
                    {t('Help')}
                </Typography>
                <Typography color="text.secondary">{t('Short, practical guidance for Zeitfokus.')}</Typography>
            </Box>
            <Stack spacing={2}>
                <Alert severity="info">
                    {t(
                        'Zeitfokus keeps your data on your server. The help content describes the current workflow and clearly marks planned features.'
                    )}
                </Alert>
                {topics.map(({title, body}) => (
                    <Accordion key={title} defaultExpanded={title === 'Recording time'}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography fontWeight={600}>{t(title)}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography color="text.secondary">{t(body)}</Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
                <Paper variant="outlined" sx={{p: 2.5}}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        {t('Current keyboard hint')}
                    </Typography>
                    <Chip label="Ctrl / Cmd + Enter" size="small" sx={{mr: 1}} />
                    <Typography component="span" variant="body2" color="text.secondary">
                        {t('Submit the new entry')}
                    </Typography>
                </Paper>
            </Stack>
        </Box>
    );
};
