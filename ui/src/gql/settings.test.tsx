import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {MockedProvider} from '@apollo/client/testing';
import {Settings, useSettings} from './settings';

let host: HTMLDivElement;
let root: Root;
let latest: ReturnType<typeof useSettings>;
const Probe = () => {
    latest = useSettings();
    return null;
};
const response = {
    userSettings: {
        __typename: 'UserSettings',
        theme: 'System',
        dateLocale: 'German',
        firstDayOfTheWeek: 'Monday',
        dateTimeInputStyle: 'Fancy',
        interfaceLanguage: 'German',
        workTargetProfile: {__typename: 'WorkTargetProfile', enabled: true, weeklyHours: 40, workDays: ['Monday']},
    },
};
const mocks = [{request: {query: Settings}, result: {data: response}, delay: 0}];
beforeEach(() => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
});

test('unchanged nested profile keeps its identity across component renders', async () => {
    const render = () =>
        root.render(
            <MockedProvider mocks={mocks}>
                <Probe />
            </MockedProvider>
        );
    await act(async () => {
        render();
    });
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(latest.done).toBe(true);
    const profile = latest.workTargetProfile;
    expect(profile?.enabled).toBe(true);
    await act(async () => {
        render();
    });
    expect(latest.workTargetProfile).toBe(profile);
    expect(profile).not.toHaveProperty('__typename');
});
