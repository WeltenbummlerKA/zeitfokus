import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {vi} from 'vitest';
import {AIPage} from './AIPage';

const mocks = vi.hoisted(() => ({query: vi.fn(), save: vi.fn()}));
vi.mock('@apollo/client', async (original) => ({
    ...(await original<typeof import('@apollo/client')>()),
    useQuery: mocks.query,
    useMutation: () => [mocks.save, {loading: false}],
}));
vi.mock('../i18n', () => ({useI18n: () => ({language: 'de'})}));
let root: Root;
let host: HTMLDivElement;
let enabled = true;
beforeEach(() => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    enabled = true;
    mocks.save
        .mockReset()
        .mockResolvedValue({
            data: {
                analyzeTimeReport: {
                    text: 'Ein konzentrierter Zeitraum.',
                    completedEntries: 3,
                    totalSeconds: 7200,
                    daysWithActivity: 2,
                },
            },
        });
    mocks.query.mockImplementation((query) =>
        query.definitions[0].name.value === 'AIStatus'
            ? {data: {aiStatus: {enabled, provider: enabled ? 'ollama' : 'disabled'}}, loading: false}
            : {data: {user: {admin: false}}}
    );
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
});
const render = async () => {
    await act(async () => {
        root.render(
            <MemoryRouter>
                <AIPage />
            </MemoryRouter>
        );
    });
};
const submit = async () => {
    await act(async () => {
        host.querySelector('form')!.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
};

test('analysis starts only after explicit submission and shows the returned report', async () => {
    await render();
    expect(mocks.save).not.toHaveBeenCalled();
    await submit();
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('Ein konzentrierter Zeitraum.');
    expect(host.textContent).toContain('2:00');
    expect(host.querySelector('a[href="/user/settings#ai-settings-title"]')).toBeNull();
});
test('disabled configuration prevents analysis even on a direct form submission', async () => {
    enabled = false;
    await render();
    await submit();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(host.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(host.textContent).toContain('Ein Administrator');
});
test('a failed request leaves an actionable error and allows retry', async () => {
    mocks.save.mockRejectedValueOnce(new Error('offline'));
    await render();
    await submit();
    expect(host.textContent).toContain('Die Auswertung ist fehlgeschlagen.');
    await submit();
    expect(host.textContent).toContain('Ein konzentrierter Zeitraum.');
    expect(host.textContent).not.toContain('Die Auswertung ist fehlgeschlagen.');
});
