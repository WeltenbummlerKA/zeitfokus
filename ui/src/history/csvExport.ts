export interface ExportSpan {
    id: number;
    start: string;
    end?: string | null;
    note: string;
    tags?: Array<{key: string; value: string}> | null;
}

export interface ExportCursor {
    startId?: number;
    offset: number;
    pageSize: number;
}

export interface ExportPage {
    timeSpans: ExportSpan[];
    cursor: ExportCursor & {startId: number; hasMore: boolean};
    matchingCount: number;
    totalSeconds: number;
}

export interface ExportRange {
    from?: string | null;
    toExclusive?: string | null;
}

// Fail the whole export if a page is missing or changes while downloading. A partial
// file would look complete to its recipient and must never be offered as a download.
export const loadCompleteHistory = async (
    fetchPage: (cursor: ExportCursor) => Promise<ExportPage>,
    signal?: AbortSignal,
    onProgress?: (count: number, total: number) => void
): Promise<ExportSpan[]> => {
    let cursor: ExportCursor = {offset: 0, pageSize: 100};
    let expectedCount: number | undefined;
    let expectedSeconds: number | undefined;
    const result: ExportSpan[] = [];
    const ids = new Set<number>();
    while (true) {
        signal?.throwIfAborted();
        const page = await fetchPage(cursor);
        signal?.throwIfAborted();
        expectedCount ??= page.matchingCount;
        expectedSeconds ??= page.totalSeconds;
        if (
            page.matchingCount !== expectedCount ||
            page.totalSeconds !== expectedSeconds ||
            (cursor.startId !== undefined && cursor.startId !== page.cursor.startId)
        ) {
            throw new Error('History changed during export');
        }
        for (const span of page.timeSpans) {
            if (ids.has(span.id) || !span.end) {
                throw new Error('Invalid history page');
            }
            ids.add(span.id);
            result.push(span);
        }
        if (page.cursor.offset !== result.length || result.length > expectedCount) {
            throw new Error('Incomplete history page');
        }
        onProgress?.(result.length, expectedCount);
        if (!page.cursor.hasMore) {
            if (result.length !== expectedCount) {
                throw new Error('Incomplete history export');
            }
            return result;
        }
        if (page.cursor.offset <= cursor.offset) {
            throw new Error('History cursor did not advance');
        }
        cursor = {offset: page.cursor.offset, startId: page.cursor.startId, pageSize: 100};
    }
};

const textCell = (value: string): string => {
    // CSV quoting alone does not prevent spreadsheet formula execution. Prefix
    // user-supplied formula-like values; retain the original text after the prefix.
    const safe = /^[\t\r\n]/u.test(value) || /^\s*[=+\-@]/u.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
};

const reportInterval = (span: ExportSpan, range: ExportRange) => {
    const originalStart = Date.parse(span.start);
    const originalEnd = span.end ? Date.parse(span.end) : NaN;
    const from = range.from ? Date.parse(range.from) : originalStart;
    const to = range.toExclusive ? Date.parse(range.toExclusive) : originalEnd;
    if (![originalStart, originalEnd, from, to].every(Number.isFinite)) {
        throw new Error('Invalid timestamp in export');
    }
    const start = Math.max(originalStart, from);
    const end = Math.min(originalEnd, to);
    if (end < start) {
        throw new Error('Invalid interval in export');
    }
    return {start: new Date(start).toISOString(), end: new Date(end).toISOString(), seconds: (end - start) / 1000};
};

// Stable machine-readable headers work with both interface languages. Original
// timestamps retain their offsets; report_* and duration_seconds describe the
// clipped contribution to the selected half-open report interval.
export const historyToCsv = (entries: ExportSpan[], range: ExportRange = {}): string => {
    const rows = ['id,original_start,original_end,report_start_utc,report_end_utc,duration_seconds,description,tags_json'];
    for (const entry of entries) {
        const interval = reportInterval(entry, range);
        rows.push(
            [
                String(entry.id),
                textCell(entry.start),
                textCell(entry.end!),
                textCell(interval.start),
                textCell(interval.end),
                String(interval.seconds),
                textCell(entry.note),
                textCell(JSON.stringify(entry.tags ?? [])),
            ].join(',')
        );
    }
    return `\uFEFF${rows.join('\r\n')}\r\n`;
};
