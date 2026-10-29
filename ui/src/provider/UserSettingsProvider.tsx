import * as React from 'react';
import {useSettings} from '../gql/settings';
import {CenteredSpinner} from '../common/CenteredSpinner';
import moment from 'moment';
import '../utils/momentLocales';
import {DateLocale, WeekDay, InterfaceLanguage} from '../gql/__generated__';
import {setLanguage, useI18n} from '../i18n';
import {expectNever} from '../utils/never';

export const configureDateLocale = (locale: DateLocale, language: 'de' | 'en', firstDay: WeekDay) => {
    const formats: Record<DateLocale, {date: string; time: string; seconds: string}> = {
        [DateLocale.American]: {date: 'MM/DD/YYYY', time: 'h:mm A', seconds: 'h:mm:ss A'},
        [DateLocale.American24h]: {date: 'MM/DD/YYYY', time: 'HH:mm', seconds: 'HH:mm:ss'},
        [DateLocale.Australian]: {date: 'DD/MM/YYYY', time: 'h:mm A', seconds: 'h:mm:ss A'},
        [DateLocale.British]: {date: 'DD/MM/YYYY', time: 'HH:mm', seconds: 'HH:mm:ss'},
        [DateLocale.German]: {date: 'DD.MM.YYYY', time: 'HH:mm', seconds: 'HH:mm:ss'},
    };
    const {date, time, seconds} = formats[locale];
    moment.locale(language);
    moment.updateLocale(language, {
        longDateFormat: {
            L: date,
            LT: time,
            LTS: seconds,
            LL: 'D MMMM YYYY',
            LLL: 'D MMMM YYYY ' + time,
            LLLL: 'dddd, D MMMM YYYY ' + time,
        },
        week: {dow: weekDayToMoment(firstDay), doy: language === 'de' ? 4 : 6},
    });
};

const weekDayToMoment = (s: WeekDay): number => {
    switch (s) {
        case WeekDay.Sunday:
            return 0;
        case WeekDay.Monday:
            return 1;
        case WeekDay.Tuesday:
            return 2;
        case WeekDay.Wednesday:
            return 3;
        case WeekDay.Thursday:
            return 4;
        case WeekDay.Friday:
            return 5;
        case WeekDay.Saturday:
            return 6;
        default:
            return expectNever(s);
    }
};

export const BootUserSettings: React.FC<React.PropsWithChildren> = ({children}): React.ReactElement => {
    const {done, firstDayOfTheWeek, dateLocale, interfaceLanguage} = useSettings();
    const {language} = useI18n();
    React.useEffect(() => {
        if (interfaceLanguage) {
            setLanguage(interfaceLanguage === InterfaceLanguage.German ? 'de' : 'en');
        }
    }, [interfaceLanguage]);
    const applied = React.useRef<string | null>(null);

    // Applied directly during render (not in a useEffect): children are rendered for the
    // first time in this exact same pass once `done` flips to true, so a useEffect here would
    // always run one tick too late for their first paint, leaving them stuck reading whatever
    // locale was active before this ever ran.
    if (done) {
        const key = `${language}-${dateLocale}-${firstDayOfTheWeek}`;
        if (applied.current !== key) {
            applied.current = key;
            configureDateLocale(dateLocale, language, firstDayOfTheWeek);
        }
    }

    if (!done) {
        return <CenteredSpinner />;
    }

    return <>{children}</>;
};
