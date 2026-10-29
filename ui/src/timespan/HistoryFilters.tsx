import * as React from 'react';
import {Accordion, AccordionDetails, AccordionSummary, Box, Button, Stack, TextField, Typography} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Search from '@mui/icons-material/Search';
import {t, useI18n} from '../i18n';
import {TagSelector} from '../tag/TagSelector';
import {emptyHistoryDraft, HistoryFilterDraft, isValidHistoryDateRange} from './historyFilterUtils';

interface HistoryFiltersProps {
    onApply: (draft: HistoryFilterDraft) => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({onApply}) => {
    useI18n();
    const [draft, setDraft] = React.useState<HistoryFilterDraft>(emptyHistoryDraft);
    const valid = isValidHistoryDateRange(draft);
    const update = <K extends keyof HistoryFilterDraft>(key: K, value: HistoryFilterDraft[K]) =>
        setDraft((previous) => ({...previous, [key]: value}));
    return (
        <Box
            component="form"
            onSubmit={(event) => {
                event.preventDefault();
                if (valid) {
                    onApply(draft);
                }
            }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))'},
                    gap: 2,
                }}>
                <TextField
                    fullWidth
                    type="search"
                    label={t('Search all entries')}
                    placeholder={t('Description or tag')}
                    value={draft.query}
                    onChange={(event) => update('query', event.target.value)}
                    inputProps={{maxLength: 500, 'data-history-search': true}}
                />
                <TextField
                    fullWidth
                    type="date"
                    label={t('From')}
                    value={draft.from}
                    onChange={(event) => update('from', event.target.value)}
                    InputLabelProps={{shrink: true}}
                />
                <TextField
                    fullWidth
                    type="date"
                    label={t('To (inclusive)')}
                    value={draft.to}
                    onChange={(event) => update('to', event.target.value)}
                    InputLabelProps={{shrink: true}}
                    error={!valid}
                />
            </Box>
            {!valid && (
                <Typography color="error" role="alert" sx={{mt: 1}}>
                    {t('Choose a valid date range.')}
                </Typography>
            )}
            <Accordion disableGutters elevation={0} sx={{my: 1, background: 'transparent', '&:before': {display: 'none'}}}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{px: 0}}>
                    <Typography>
                        {t('Tag filters')}
                        {draft.include.length + draft.exclude.length > 0
                            ? ` (${draft.include.length + draft.exclude.length})`
                            : ''}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{px: 0}}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{mb: 1}}>
                                {t('Require all selected tags')}
                            </Typography>
                            <TagSelector
                                createTags={false}
                                allowDuplicateKeys
                                selectedEntries={draft.include}
                                onSelectedEntriesChanged={(entries) => update('include', entries)}
                            />
                        </Box>
                        <Box>
                            <Typography variant="body2" fontWeight={600} sx={{mb: 1}}>
                                {t('Exclude selected tags')}
                            </Typography>
                            <TagSelector
                                createTags={false}
                                allowDuplicateKeys
                                selectedEntries={draft.exclude}
                                onSelectedEntriesChanged={(entries) => update('exclude', entries)}
                            />
                        </Box>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Stack direction="row" spacing={1} sx={{flexWrap: 'wrap', gap: 1}}>
                <Button type="submit" variant="contained" startIcon={<Search />} disabled={!valid}>
                    {t('Apply filters')}
                </Button>
                <Button
                    onClick={() => {
                        const empty = emptyHistoryDraft();
                        setDraft(empty);
                        onApply(empty);
                    }}>
                    {t('Reset filters')}
                </Button>
            </Stack>
        </Box>
    );
};
