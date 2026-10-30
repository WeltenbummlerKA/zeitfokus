import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {vi} from 'vitest';
import {DashboardPage} from './DashboardPage';
import {setLanguage} from '../i18n';

vi.mock('@apollo/client', async (original) => ({
    ...(await original<typeof import('@apollo/client')>()),
    useQuery: () => ({
        data: {
            dashboards: [
                {
                    id: 11,
                    name: 'Meine Woche',
                    items: [],
                    ranges: [{id: 1, name: 'new range', editable: true, range: {from: 'now/w', to: 'now/w'}}],
                },
            ],
        },
        loading: false,
    }),
    useMutation: () => [vi.fn().mockResolvedValue({})],
}));
vi.mock('notistack', () => ({useSnackbar: () => ({enqueueSnackbar: vi.fn()})}));
vi.mock('react-grid-layout', () => ({
    default: ({children}: React.PropsWithChildren) => <div>{children}</div>,
    WidthProvider: (component: unknown) => component,
}));
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    setLanguage('de');
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
    setLanguage('en');
});
test('German dashboard editing does not expose legacy English controls or the default range name', async () => {
    await act(async () =>
        root.render(
            <MemoryRouter initialEntries={['/dashboard/11']}>
                <Routes>
                    <Route path="/dashboard/:id" element={<DashboardPage />} />
                </Routes>
            </MemoryRouter>
        )
    );
    const edit = [...host.querySelectorAll('button')].find((button) => button.textContent === 'Übersicht bearbeiten')!;
    await act(async () => {
        edit.click();
    });
    expect(host.textContent).toContain('Bearbeiten beenden');
    expect(host.textContent).toContain('Mobilansicht');
    expect(host.textContent).not.toContain('Exit Editing');
    expect(host.textContent).not.toContain('Mobile View');
    expect(host.querySelector<HTMLInputElement>('input[aria-label="Name des Zeitraums"]')!.value).toBe('Neuer Zeitraum');
});
