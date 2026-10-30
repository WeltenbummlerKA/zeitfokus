import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {vi} from 'vitest';
import {AISettingsSection} from './AISettingsSection';

const mocks = vi.hoisted(() => ({query: vi.fn(), mutation: vi.fn(), save: vi.fn()}));
vi.mock('@apollo/client', async (original) => ({
    ...(await original<typeof import('@apollo/client')>()),
    useQuery: mocks.query,
    useMutation: mocks.mutation,
}));
vi.mock('../i18n', () => ({useI18n: () => ({language: 'de'})}));

const settings = {provider: 'ollama', baseURL: 'http://127.0.0.1:11434', model: 'local-model', timeoutSeconds: 60};
const queryResult = {data: {aiSettings: settings}, loading: false, refetch: vi.fn()};
let host: HTMLDivElement;
let root: Root;
let admin = true;

beforeEach(() => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    admin = true;
    mocks.query.mockReset();
    mocks.save.mockReset().mockResolvedValue({data: {setAISettings: settings}});
    mocks.query.mockImplementation((document) =>
        document.definitions[0].name.value === 'CurrentUser' ? {data: {user: {admin}}} : queryResult
    );
    mocks.mutation.mockReturnValue([mocks.save, {loading: false}]);
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
        root.render(<AISettingsSection />);
    });
};

test('administrator can select either provider and save the complete server configuration', async () => {
    await render();
    const select = host.querySelector('select')!;
    expect([...select.options].map((option) => option.text)).toEqual(['Deaktiviert', 'Ollama', 'LM Studio']);
    expect(select.value).toBe('ollama');
    act(() => {
        select.value = 'lmstudio';
        select.dispatchEvent(new Event('change', {bubbles: true}));
    });
    await act(async () => {
        host.querySelector('form')!.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    expect(mocks.save).toHaveBeenCalledWith({variables: {settings: {...settings, provider: 'lmstudio'}}});
    expect(host.textContent).toContain('KI-Einstellungen gespeichert.');
});

test('regular users do not load or edit the administrator connection', async () => {
    admin = false;
    await render();
    expect(host.querySelector('form')).toBeNull();
    expect(host.textContent).toContain('Administratorkonto');
    expect(mocks.query).toHaveBeenCalledTimes(1);
});

test('save failure remains visible and retains the draft for retry', async () => {
    mocks.save.mockRejectedValueOnce(new Error('offline'));
    await render();
    act(() => {
        const select = host.querySelector('select')!;
        select.value = 'lmstudio';
        select.dispatchEvent(new Event('change', {bubbles: true}));
    });
    await act(async () => {
        host.querySelector('form')!.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    expect(host.textContent).toContain('Speichern fehlgeschlagen.');
    expect(host.querySelector('select')!.value).toBe('lmstudio');
    expect(host.querySelector('button')!.disabled).toBe(false);
});

test('unchanged connection cannot be saved again', async () => {
    await render();
    expect(host.querySelector('button')!.disabled).toBe(true);
    await act(async () => {
        host.querySelector('form')!.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
    });
    expect(mocks.save).not.toHaveBeenCalled();
});
