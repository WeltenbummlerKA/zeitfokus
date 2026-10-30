import {gql, useQuery} from '@apollo/client';
import {useMemo} from 'react';
import {SettingsQuery as SettingsQueryResponse, DateLocale, Theme, WeekDay, DateTimeInputStyle} from './__generated__';
import {stripTypename} from '../utils/strip';

export const Settings = gql`
    query Settings {
        userSettings {
            interfaceLanguage
            workTargetProfile {
                enabled
                weeklyHours
                workDays
            }
            theme
            dateLocale
            firstDayOfTheWeek
            dateTimeInputStyle
        }
    }
`;

export const SetSettings = gql`
    mutation SetSettings($settings: InputUserSettings!) {
        setUserSettings(settings: $settings) {
            theme
            dateTimeInputStyle
        }
    }
`;

const defaultSettings = {
    theme: Theme.System,
    dateLocale: DateLocale.American,
    firstDayOfTheWeek: WeekDay.Monday,
    dateTimeInputStyle: DateTimeInputStyle.Fancy,
    interfaceLanguage: null,
    workTargetProfile: null,
} as const;

export const useSettings = (): {done: boolean} & Omit<SettingsQueryResponse['userSettings'], '__typename'> => {
    const data = useQuery<SettingsQueryResponse>(Settings);
    const settings = useMemo(() => (data.data ? stripTypename(data.data.userSettings) : null), [data.data]);

    if (data.loading || data.error || !settings) {
        return {...defaultSettings, done: false};
    }
    return {done: true, ...settings};
};

export const SetInterfaceLanguage = gql`
    mutation SetInterfaceLanguage($language: InterfaceLanguage!) {
        setInterfaceLanguage(language: $language) {
            interfaceLanguage
            theme
            dateLocale
            firstDayOfTheWeek
            dateTimeInputStyle
        }
    }
`;

export const SetWorkTargetProfile = gql`
    mutation SetWorkTargetProfile($profile: InputWorkTargetProfile!) {
        setWorkTargetProfile(profile: $profile) {
            workTargetProfile {
                enabled
                weeklyHours
                workDays
            }
        }
    }
`;
