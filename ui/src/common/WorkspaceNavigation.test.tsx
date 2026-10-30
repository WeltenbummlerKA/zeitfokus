import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {vi} from 'vitest';
import {WorkspaceNavigation} from './WorkspaceNavigation';
vi.mock('../i18n', () => ({useI18n: () => ({language: 'de'}), t: (value: string) => value}));
let host: HTMLDivElement;
let root: Root;
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
test('AI is a selected first-level destination and administrator links stay role-restricted', () => {
    const navigate = vi.fn();
    act(() =>
        root.render(
            <MemoryRouter initialEntries={['/ai']}>
                <WorkspaceNavigation dashboards={[]} admin={false} version="1.1.0" onNavigate={navigate} />
            </MemoryRouter>
        )
    );
    const ai = host.querySelector<HTMLAnchorElement>('a[href="/ai"]')!;
    expect(ai.textContent).toContain('KI');
    expect(ai.getAttribute('aria-current')).toBe('page');
    expect(host.querySelector('a[href="/admin/users"]')).toBeNull();
    act(() => {
        ai.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
    });
    expect(navigate).toHaveBeenCalledTimes(1);
});

test('one help button opens the current topic and navigation shows explanatory hover tooltips', () => {
    vi.useFakeTimers();
    try {
        act(() =>
            root.render(
                <MemoryRouter initialEntries={['/user/settings']}>
                    <WorkspaceNavigation dashboards={[]} admin={false} version="1.1.1" onNavigate={vi.fn()} />
                </MemoryRouter>
            )
        );
        const help = host.querySelectorAll<HTMLAnchorElement>('a[href^="/help"]');
        expect(help).toHaveLength(1);
        expect(help[0].getAttribute('href')).toBe('/help#settings');
        const settings = host.querySelector<HTMLAnchorElement>('a[href="/user/settings"]')!;
        settings.getBoundingClientRect = () => new DOMRect(20, 20, 200, 44);
        act(() => {
            settings.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
            vi.advanceTimersByTime(500);
        });
        expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
            'Sprache, Darstellung und Arbeitszeitprofil einstellen'
        );
    } finally {
        vi.useRealTimers();
    }
});
