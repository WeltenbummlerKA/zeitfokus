import moment from 'moment';
import {InputHistoryFilter} from '../gql/__generated__';
import {TagSelectorEntry, toInputTags} from '../tag/tagSelectorEntry';

export interface HistoryFilterDraft {
    query: string;
    from: string;
    to: string;
    include: TagSelectorEntry[];
    exclude: TagSelectorEntry[];
}

export const emptyHistoryDraft = (): HistoryFilterDraft => ({query: '', from: '', to: '', include: [], exclude: []});

export const isValidHistoryDateRange = ({from, to}: Pick<HistoryFilterDraft, 'from' | 'to'>): boolean => {
    const start = from ? moment(from, 'YYYY-MM-DD', true) : undefined;
    const end = to ? moment(to, 'YYYY-MM-DD', true) : undefined;
    return (!start || start.isValid()) && (!end || end.isValid()) && (!start || !end || !start.isAfter(end));
};

// Local calendar boundaries keep DST days at their real 23/25-hour lengths.
export const historyFilterFromDraft = (draft: HistoryFilterDraft): InputHistoryFilter => ({
    query: draft.query.trim() || undefined,
    from: draft.from ? moment(draft.from, 'YYYY-MM-DD', true).startOf('day').format() : undefined,
    toExclusive: draft.to ? moment(draft.to, 'YYYY-MM-DD', true).add(1, 'day').startOf('day').format() : undefined,
    requireTags: toInputTags(draft.include),
    excludeTags: toInputTags(draft.exclude),
});

export const formatHistoryDuration = (seconds: number): string => {
    const minutes = Math.floor(Math.max(0, seconds) / 60);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
};
