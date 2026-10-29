import moment from 'moment';
import {WeekDay} from '../gql/__generated__';

const dayNumbers: Record<WeekDay, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

// Calendar arithmetic preserves local week boundaries across 23/25-hour DST days.
export const workTargetWeekRange = (now: moment.Moment, firstDay: WeekDay) => {
    const start = now
        .clone()
        .startOf('day')
        .subtract((now.day() - dayNumbers[firstDay] + 7) % 7, 'days');
    return {from: start.format(), toExclusive: start.clone().add(7, 'days').format()};
};

export const dailyTargetHours = (weeklyHours: number, workDays: WeekDay[], day: number): number =>
    workDays.length > 0 && workDays.some((value) => dayNumbers[value] === day) ? weeklyHours / workDays.length : 0;
