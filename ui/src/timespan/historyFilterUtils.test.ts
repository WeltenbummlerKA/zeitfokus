import moment from 'moment';
import {emptyHistoryDraft, formatHistoryDuration, historyFilterFromDraft, isValidHistoryDateRange} from './historyFilterUtils';

test('inclusive end date becomes the next local midnight and same-day filters stay valid', () => {
    const draft = {...emptyHistoryDraft(), from: '2026-03-29', to: '2026-03-29', query: '  review  '};
    expect(isValidHistoryDateRange(draft)).toBe(true);
    const filter = historyFilterFromDraft(draft);
    expect(moment(filter.from).format('YYYY-MM-DD HH:mm')).toBe('2026-03-29 00:00');
    expect(moment(filter.toExclusive).format('YYYY-MM-DD HH:mm')).toBe('2026-03-30 00:00');
    expect(filter.query).toBe('review');
});

test('invalid or reversed date filters are rejected', () => {
    expect(isValidHistoryDateRange({from: '2026-02-30', to: ''})).toBe(false);
    expect(isValidHistoryDateRange({from: '2026-10-30', to: '2026-10-29'})).toBe(false);
    expect(isValidHistoryDateRange({from: '', to: '2026-10-29'})).toBe(true);
});

test('cleared filters omit the range and duration totals do not wrap after 24 hours', () => {
    expect(historyFilterFromDraft(emptyHistoryDraft())).toEqual({
        query: undefined,
        from: undefined,
        toExclusive: undefined,
        requireTags: [],
        excludeTags: [],
    });
    expect(formatHistoryDuration(90000)).toBe('25:00');
    expect(formatHistoryDuration(3599)).toBe('0:59');
});
