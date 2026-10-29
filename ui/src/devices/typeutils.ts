import {t} from '../i18n';
import {DeviceType} from '../gql/__generated__';
import {expectNever} from '../utils/never';

export const deviceTypeToString = (type: DeviceType) => {
    switch (type) {
        case DeviceType.LongExpiry:
            return t('A month of inactivity');
        case DeviceType.ShortExpiry:
            return t('An hour of inactivity');
        case DeviceType.NoExpiry:
            return t('Never');
        default:
            return expectNever(type);
    }
};
