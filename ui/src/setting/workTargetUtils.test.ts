import {describe, expect, it} from 'vitest';
import moment from 'moment-timezone';
import {WeekDay} from '../gql/__generated__';
import {dailyTargetHours, workTargetWeekRange} from './workTargetUtils';

describe('work target calendar boundaries', () => {
    it('honors the configured week start and preserves DST week length', () => {
        const range = workTargetWeekRange(moment.tz('2026-03-29T12:00:00', 'Europe/Berlin'), WeekDay.Monday);
        expect(range.from).toBe('2026-03-23T00:00:00+01:00');
        expect(range.toExclusive).toBe('2026-03-30T00:00:00+02:00');
        expect(moment(range.toExclusive).diff(moment(range.from), 'hours')).toBe(167);
    });
    it('distributes the weekly target only across configured work days', () => {
        const days = [WeekDay.Monday, WeekDay.Friday];
        expect(dailyTargetHours(16, days, 1)).toBe(8);
        expect(dailyTargetHours(16, days, 0)).toBe(0);
        expect(dailyTargetHours(16, [], 1)).toBe(0);
    });
});
