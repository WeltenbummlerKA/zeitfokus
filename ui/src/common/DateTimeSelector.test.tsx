import * as React from 'react';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import moment from 'moment';
import {vi} from 'vitest';
import {DateTimeSelector} from './DateTimeSelector';

interface PickerProps {
    value: moment.Moment;
    onOpen: () => void;
    onClose: () => void;
}

let picker: PickerProps;

vi.mock('@mui/x-date-pickers/DesktopDateTimePicker', () => ({
    DesktopDateTimePicker: (props: PickerProps) => {
        picker = props;
        return null;
    },
}));
vi.mock('../gql/settings', () => ({useSettings: () => ({done: true, dateTimeInputStyle: 'Fancy'})}));

test('closing an unchanged picker restores synchronization with server dates', () => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    const host = document.createElement('div');
    const root = createRoot(host);
    const onSelectDate = vi.fn();
    const render = (time: string) =>
        root.render(<DateTimeSelector selectedDate={moment(time)} onSelectDate={onSelectDate} showDate label="Start" />);
    try {
        act(() => render('2026-10-29T10:00:00'));
        act(() => picker.onOpen());
        act(() => picker.onClose());
        act(() => render('2026-10-29T12:00:00'));
        expect(picker.value.format('HH:mm')).toBe('12:00');
        expect(onSelectDate).not.toHaveBeenCalled();
    } finally {
        act(() => root.unmount());
    }
});
