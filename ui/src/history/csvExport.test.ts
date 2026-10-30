import {describe, expect, it} from 'vitest';
import {ExportPage, ExportSpan, historyToCsv, loadCompleteHistory} from './csvExport';

const entry = (id: number): ExportSpan => ({
    id,
    start: '2026-10-25T01:00:00+02:00',
    end: '2026-10-25T04:00:00+01:00',
    note: `Work ${id}`,
    tags: [{key: 'project', value: 'Test'}],
});

const page = (entries: ExportSpan[], offset: number, hasMore: boolean): ExportPage => ({
    timeSpans: entries,
    matchingCount: 3,
    totalSeconds: 43200,
    cursor: {startId: 3, pageSize: 2, offset, hasMore},
});

describe('complete history CSV export', () => {
    it('fetches every page with a fixed snapshot and never exports only the loaded page', async () => {
        const cursors: unknown[] = [];
        const result = await loadCompleteHistory(async (cursor) => {
            cursors.push(cursor);
            return cursor.offset === 0 ? page([entry(3), entry(2)], 2, true) : page([entry(1)], 3, false);
        });
        expect(result.map(({id}) => id)).toEqual([3, 2, 1]);
        expect(cursors).toEqual([
            {offset: 0, pageSize: 100},
            {offset: 2, pageSize: 100, startId: 3},
        ]);
    });

    it('rejects partial and changed downloads rather than returning a partial file', async () => {
        await expect(
            loadCompleteHistory(async (cursor) => {
                if (cursor.offset) {
                    throw new Error('network unavailable');
                }
                return page([entry(3), entry(2)], 2, true);
            })
        ).rejects.toThrow('network unavailable');
        await expect(
            loadCompleteHistory(async (cursor) =>
                cursor.offset ? {...page([entry(1)], 3, false), matchingCount: 4} : page([entry(3), entry(2)], 2, true)
            )
        ).rejects.toThrow('History changed');
    });

    it('stops an aborted export', async () => {
        const controller = new AbortController();
        controller.abort();
        await expect(loadCompleteHistory(async () => page([], 0, false), controller.signal)).rejects.toThrow();
    });

    it('clips a DST-spanning entry using UTC instants and keeps the original offsets', () => {
        const csv = historyToCsv([entry(1)], {from: '2026-10-25T02:00:00+02:00', toExclusive: '2026-10-25T03:00:00+01:00'});
        expect(csv).toContain('"2026-10-25T01:00:00+02:00","2026-10-25T04:00:00+01:00"');
        expect(csv).toContain('"2026-10-25T00:00:00.000Z","2026-10-25T02:00:00.000Z",7200');
        expect(csv.startsWith('\uFEFFid,')).toBe(true);
    });

    it('quotes delimiters and newlines and neutralizes spreadsheet formulas in descriptions', () => {
        const csv = historyToCsv([{...entry(1), note: '=HYPERLINK("example");\nsecond line'}]);
        expect(csv).toContain('"\'=HYPERLINK(""example"");\nsecond line"');
        expect(csv).toContain('"[{""key"":""project"",""value"":""Test""}]"');
    });
});
