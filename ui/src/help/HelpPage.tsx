import {t, useI18n} from '../i18n';
import * as React from 'react';
import {Accordion, AccordionDetails, AccordionSummary, Alert, Box, Paper, Stack, Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {shortcutLabel} from '../keyboard/shortcuts';

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
        body: 'Keyboard commands work outside text fields, menus and dialogs. Use Ctrl + Alt on Windows/Linux or Command + Option on Mac. Holding a key does not repeat an action.',
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
                    <Box
                        component="dl"
                        sx={{
                            m: 0,
                            display: 'grid',
                            gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'max-content minmax(0, 1fr)'},
                            columnGap: 3,
                            rowGap: 1.5,
                            '& dd': {m: 0},
                        }}>
                        {[
                            ['T', 'Start timer'],
                            ['S', 'Stop'],
                            ['N', 'Focus new description'],
                            ['F', 'Search all entries'],
                            ['1', 'List'],
                            ['2', 'Calendar'],
                            [',', 'Settings'],
                            ['H', 'Help'],
                        ].map(([key, label]) => (
                            <React.Fragment key={key}>
                                <Typography component="dt" variant="body2">
                                    <kbd>{shortcutLabel(key)}</kbd>
                                </Typography>
                                <Typography component="dd" variant="body2">
                                    {t(label)}
                                </Typography>
                            </React.Fragment>
                        ))}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                        {t(
                            'Ctrl/Cmd + Enter submits from the description or empty tag field. Start and stop shortcuts work in the time tracking view; if several timers are running, Stop focuses a timer for you to choose.'
                        )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{mt: 1}}>
                        {t('All commands are also available as buttons or links, including on touch devices.')}
                    </Typography>
                </Paper>
            </Stack>
        </Box>
    );
};
