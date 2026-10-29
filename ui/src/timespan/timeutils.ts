import moment from 'moment-timezone';
import prettyMs from 'pretty-ms';

export const timeRunning = (date: moment.Moment, now: moment.Moment) => {
    const d = inUserTz(now).unix() - inUserTz(date).unix();
    return prettyMs(Math.max(0, d) * 1000, {unitCount: 2}).replace(/^~/, '');
};

export const timeRunningCalendar = (date: moment.Moment, now: moment.Moment) => {
    const d = inUserTz(now).unix() - inUserTz(date).unix();

    if (d < 60) {
        return '<1m';
    }

    return prettyMs(d * 1000, {unitCount: d < 60 * 60 * 24 ? 1 : 2}).replace(/^~/, '');
};

export const uglyConvertToLocalTime = (m: moment.Moment): moment.Moment => {
    const withoutTimeZone: string = m.format('YYYY-MM-DDTHH:mm:ss');
    return moment(withoutTimeZone);
};

export const inUserTz = (m: moment.Moment): moment.Moment => m.tz(moment.tz.guess());
