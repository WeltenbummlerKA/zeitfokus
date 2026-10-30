import moment from 'moment';
import {configureDateLocale} from './UserSettingsProvider';
import {DateLocale, WeekDay} from '../gql/__generated__';
test('language changes preserve numeric date format and week preference across repeated switches', () => {
    configureDateLocale(DateLocale.German, 'en', WeekDay.Sunday);
    expect(moment('2026-10-29T14:15:00').format('L LT dddd')).toBe('29.10.2026 14:15 Thursday');
    configureDateLocale(DateLocale.American, 'de', WeekDay.Monday);
    expect(moment('2026-10-29T14:15:00').format('L LT dddd')).toBe('10/29/2026 2:15 PM Donnerstag');
    expect(moment.localeData().firstDayOfWeek()).toBe(1);
    configureDateLocale(DateLocale.American, 'en', WeekDay.Sunday);
    expect(moment('2026-10-29T14:15:00').format('L LT')).toBe('10/29/2026 2:15 PM');
    expect(moment.localeData().firstDayOfWeek()).toBe(0);
});
