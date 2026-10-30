import {t, useI18n} from '../../i18n';
import * as React from 'react';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/NativeSelect';
import {useQuery} from '@apollo/client';
import {TagsQuery, EntryType, StatsInterval} from '../../gql/__generated__';
import * as gqlTags from '../../gql/tags';
import {toTagSelectorEntry} from '../../tag/tagSelectorEntry';
import {FormTagSelector} from '../../tag/FormTagSelector';
import {DashboardItem, DashboardItemRange} from '../../gql/types';
import {RelativeDateTimeSelector} from '../../common/RelativeDateTimeSelector';
import {parseRelativeTime} from '../../utils/time';
import {Grid, Typography, Switch} from '@mui/material';

interface EditPopupProps {
    entry: DashboardItem;
    onChange: (entry: DashboardItem | null) => void;
    disabled?: boolean;
    ranges: Record<string, string>;
}

export const isValidDashboardEntry = (item: DashboardItem): boolean => {
    return (
        item.statsSelection.tags != null &&
        item.statsSelection.tags.length > 0 &&
        ((item.statsSelection.range &&
            parseRelativeTime(item.statsSelection.range.from, 'startOf').success &&
            parseRelativeTime(item.statsSelection.range.to, 'startOf').success) ||
            !!item.statsSelection.rangeId) &&
        item.title.length > 0
    );
};
export const DashboardEntryForm: React.FC<EditPopupProps> = ({entry, onChange: setEntry, disabled = false, ranges}) => {
    useI18n();
    const [staticRange, setStaticRange] = React.useState(!entry.statsSelection.rangeId);

    const tagsResult = useQuery<TagsQuery>(gqlTags.Tags);

    let tagKeys;
    let excludeTags;
    let includeTags;
    if (!tagsResult.error && !tagsResult.loading && tagsResult.data && tagsResult.data.tags) {
        const keyInputTags = (entry.statsSelection.tags || []).map((key) => ({key, value: ''}));
        tagKeys = toTagSelectorEntry(tagsResult.data.tags, keyInputTags);
        excludeTags = toTagSelectorEntry(tagsResult.data.tags, entry.statsSelection.excludeTags || []);
        includeTags = toTagSelectorEntry(tagsResult.data.tags, entry.statsSelection.includeTags || []);
    }

    const range: DashboardItemRange = entry.statsSelection.range
        ? entry.statsSelection.range
        : {
              from: 'now/w',
              to: 'now/w',
              __typename: 'RelativeOrStaticRange',
          };

    return (
        <>
            <TextField
                label={t('Title')}
                value={entry.title}
                disabled={disabled}
                onChange={(e) => {
                    entry.title = e.target.value;
                    setEntry(entry);
                }}
                fullWidth
            />
            <FormControl margin={'normal'} fullWidth>
                <InputLabel>{t('Type')}</InputLabel>
                <Select
                    fullWidth
                    value={entry.entryType}
                    disabled={disabled}
                    onChange={(e) => {
                        entry.entryType = e.target.value as EntryType;
                        setEntry(entry);
                    }}>
                    {Object.values(EntryType).map((type) => (
                        <option key={type} value={type}>
                            {t(type)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <FormControl margin={'normal'} fullWidth>
                <InputLabel>{t('Interval')}</InputLabel>
                <Select
                    fullWidth
                    disabled={disabled}
                    value={entry.statsSelection.interval}
                    onChange={(e) => {
                        entry.statsSelection.interval = e.target.value as StatsInterval;
                        setEntry(entry);
                    }}>
                    {Object.values(StatsInterval).map((type) => (
                        <option key={type} value={type}>
                            {t(type)}
                        </option>
                    ))}
                </Select>
            </FormControl>
            <Typography component="div">
                <Grid component="label" container alignItems="center" spacing={1}>
                    <Grid item>{t('Range:')}</Grid>
                    <Grid item>{t('Global')}</Grid>
                    <Grid item>
                        <Switch
                            checked={staticRange}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setStaticRange(true);
                                    entry.statsSelection.rangeId = null;
                                    setEntry(entry);
                                } else {
                                    setStaticRange(false);

                                    if (entry.statsSelection.range === null) {
                                        entry.statsSelection.range = range;
                                        setEntry(entry);
                                    }
                                }
                            }}
                        />
                    </Grid>
                    <Grid item>{t('Static')}</Grid>
                </Grid>
            </Typography>
            {staticRange ? (
                <>
                    <RelativeDateTimeSelector
                        label={t('From')}
                        disabled={disabled}
                        value={range.from}
                        onChange={(startDate) => {
                            entry.statsSelection.rangeId = null;
                            entry.statsSelection.range = {...range, from: startDate};
                            setEntry(entry);
                        }}
                        type="startOf"
                    />
                    <RelativeDateTimeSelector
                        label={t('To')}
                        disabled={disabled}
                        value={range.to}
                        onChange={(endDate) => {
                            entry.statsSelection.rangeId = null;
                            entry.statsSelection.range = {...range, to: endDate};
                            setEntry(entry);
                        }}
                        type="endOf"
                    />
                </>
            ) : (
                <Select
                    fullWidth
                    disabled={disabled}
                    value={entry.statsSelection.rangeId || ''}
                    onChange={(e) => {
                        if (e.target.value === '') {
                            return;
                        }
                        entry.statsSelection.rangeId = parseInt(e.target.value, 10);
                        entry.statsSelection.range = null;
                        setEntry(entry);
                    }}>
                    {entry.statsSelection.rangeId ? undefined : (
                        <option key={''} value={''}>
                            {t('Select a date range')}
                        </option>
                    )}
                    {Object.keys(ranges).map((key) => (
                        <option key={key} value={key}>
                            {ranges[key]}
                        </option>
                    ))}
                </Select>
            )}
            {entry.entryType !== EntryType.PieChart ? (
                <Typography component="div">
                    <Grid component="label" container alignItems="center" spacing={1}>
                        <Grid item>{getTotalTitle(entry.entryType)}</Grid>
                        <Grid item>
                            <Switch
                                checked={entry.total}
                                onChange={(e) => {
                                    entry.total = e.target.checked;
                                    setEntry(entry);
                                }}
                            />
                        </Grid>
                    </Grid>
                </Typography>
            ) : undefined}
            <FormTagSelector
                label={t('Tags')}
                selectedEntries={tagKeys || []}
                onSelectedEntriesChanged={(tags) => {
                    entry.statsSelection.tags = tags.map((tag) => tag.tag.key);
                    setEntry(entry);
                }}
                createTags={false}
                onlySelectKeys
            />

            <FormTagSelector
                label={t('Exclude')}
                selectedEntries={excludeTags || []}
                onSelectedEntriesChanged={(tags) => {
                    entry.statsSelection.excludeTags = tags.map((tag) => ({
                        key: tag.tag.key,
                        value: tag.value,
                        __typename: 'TimeSpanTag',
                    }));
                    setEntry(entry);
                }}
                allowDuplicateKeys
                createTags={false}
            />
            <FormTagSelector
                label={t('Include')}
                selectedEntries={includeTags || []}
                onSelectedEntriesChanged={(tags) => {
                    entry.statsSelection.includeTags = tags.map((tag) => ({
                        key: tag.tag.key,
                        value: tag.value,
                        __typename: 'TimeSpanTag',
                    }));
                    setEntry(entry);
                }}
                allowDuplicateKeys
                createTags={false}
            />
        </>
    );
};

const getTotalTitle = (entryType: EntryType) => {
    switch (entryType) {
        case EntryType.HorizontalTable:
            return t('Show total row');
        case EntryType.VerticalTable:
            return t('Show total column');
        case EntryType.BarChart:
        case EntryType.StackedBarChart:
        case EntryType.LineChart:
            return t('Show total in tooltip');
        default:
            return '';
    }
};
