import {t, useI18n} from '../i18n';
import * as React from 'react';
import {Accordion, AccordionDetails, AccordionSummary, Box, Button, Paper, Stack, Typography} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {shortcutLabel} from '../keyboard/shortcuts';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import {helpTopics} from './topics';

export const HelpPage: React.FC = () => {
    const {language} = useI18n();
    const location = useLocation();
    const [expanded, setExpanded] = React.useState<string[]>(['recording']);
    React.useEffect(() => {
        const id = location.hash.slice(1);
        if (!id) {
            return;
        }
        if (helpTopics.some((topic) => topic.id === id)) {
            setExpanded((previous) => (previous.includes(id) ? previous : [...previous, id]));
        }
        const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView?.({block: 'start'}));
        return () => cancelAnimationFrame(frame);
    }, [location.hash]);
    return (
        <Box sx={{maxWidth: 900, mx: 'auto'}}>
            <Box sx={{mb: 4}}>
                <Typography component="h2" variant="h3" gutterBottom>
                    {t('Help')}
                </Typography>
                <Typography color="text.secondary">{t('Short, practical guidance for Zeitfokus.')}</Typography>
            </Box>
            <Stack spacing={2}>
                <Box
                    component="nav"
                    aria-label={language === 'de' ? 'Hilfethemen' : 'Help topics'}
                    sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1}}>
                    {helpTopics.map((topic) => (
                        <Button key={topic.id} component={RouterLink} to={`/help#${topic.id}`} variant="outlined" size="small">
                            {topic[language].title}
                        </Button>
                    ))}
                    <Button component={RouterLink} to="/help#shortcuts" variant="outlined" size="small">
                        {t('Keyboard shortcuts')}
                    </Button>
                </Box>
                {helpTopics.map((topic) => (
                    <Accordion
                        key={topic.id}
                        id={topic.id}
                        expanded={expanded.includes(topic.id)}
                        sx={{scrollMarginTop: 160}}
                        onChange={(_, open) =>
                            setExpanded((previous) => (open ? [...previous, topic.id] : previous.filter((id) => id !== topic.id)))
                        }>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id={`${topic.id}-heading`}
                            aria-controls={`${topic.id}-content`}>
                            <Typography component="h3" variant="subtitle1" fontWeight={600}>
                                {topic[language].title}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails id={`${topic.id}-content`}>
                            <Box component="ol" sx={{m: 0, pl: 2.5, '& li + li': {mt: 1.5}}}>
                                {topic[language].steps.map((step) => (
                                    <Typography component="li" key={step} color="text.secondary">
                                        {step}
                                    </Typography>
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
                <Paper id="shortcuts" component="section" variant="outlined" sx={{p: 2.5, scrollMarginTop: 160}}>
                    <Typography component="h3" variant="subtitle1" fontWeight={600} gutterBottom>
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
