import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {vi} from 'vitest';
import {HelpPage} from './HelpPage';

vi.mock('../i18n', () => ({useI18n: () => ({language: 'de'}), t: (key: string) => key}));
let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
});

test('context help opens the requested settings topic and retains other navigation', async () => {
    await act(async () => {
        root.render(
            <MemoryRouter initialEntries={['/help#settings']}>
                <HelpPage />
            </MemoryRouter>
        );
    });
    expect(host.querySelector('#settings-heading')!.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('#ai-heading')!.getAttribute('aria-expanded')).toBe('false');
    const aiLink = host.querySelector<HTMLAnchorElement>('a[href="/help#ai"]')!;
    await act(async () => {
        aiLink.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
    });
    expect(host.querySelector('#ai-heading')!.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('#settings-heading')!.getAttribute('aria-expanded')).toBe('true');
});
