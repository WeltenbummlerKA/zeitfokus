import moment from 'moment-timezone';
import {timeRunning, timeRunningCalendar} from './timeutils';
test('elapsed durations retain their leading digit, including newly started and multi-digit timers', () => {
    const start = moment('2026-10-29T10:00:00+01:00');
    expect(timeRunning(start.clone(), start.clone())).toBe('0ms');
    expect(timeRunning(start.clone(), start.clone().add(12, 'seconds'))).toBe('12s');
    expect(timeRunning(start.clone(), start.clone().add(72, 'minutes'))).toBe('1h 12m');
    expect(timeRunningCalendar(start.clone(), start.clone().add(12, 'minutes'))).toBe('12m');
});
