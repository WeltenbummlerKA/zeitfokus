import moment from 'moment';

export const analysisRange = (from: string, to: string) => {
    const start = moment(from, 'YYYY-MM-DD', true);
    const end = moment(to, 'YYYY-MM-DD', true);
    if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
        return undefined;
    }
    return {from: start.startOf('day').toISOString(), toExclusive: end.add(1, 'day').startOf('day').toISOString()};
};
