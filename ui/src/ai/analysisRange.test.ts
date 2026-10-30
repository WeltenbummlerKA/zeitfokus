import moment from 'moment-timezone';
import {analysisRange} from './analysisRange';

afterEach(() => moment.tz.setDefault());
test('inclusive calendar ranges preserve real DST day lengths', () => {
    moment.tz.setDefault('Europe/Berlin');
    for (const [date, hours] of [
        ['2026-03-29', 23],
        ['2026-10-25', 25],
    ] as const) {
        const range = analysisRange(date, date)!;
        expect(moment(range.toExclusive).diff(moment(range.from), 'hours')).toBe(hours);
    }
});
test('rejects missing, invalid and reversed dates', () => {
    for (const [from, to] of [
        ['', '2026-10-30'],
        ['2026-02-30', '2026-10-30'],
        ['2026-10-31', '2026-10-30'],
    ]) {
        expect(analysisRange(from, to)).toBeUndefined();
    }
});
