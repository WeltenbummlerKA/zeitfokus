import * as React from 'react';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {vi} from 'vitest';
import {messages} from './messages';
import {setLanguage, t, useI18n} from './index';

test('language updates visible labels without remounting and persists browser preference', () => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    const stored = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
    });
    const host = document.createElement('div');
    const root = createRoot(host);
    let mounts = 0;
    const Example = () => {
        useI18n();
        React.useEffect(() => {
            mounts++;
        }, []);
        return <button>{t('Start timer')}</button>;
    };
    try {
        act(() => {
            setLanguage('en');
            root.render(<Example />);
        });
        expect(host.textContent).toBe('Start timer');
        act(() => setLanguage('de'));
        expect(host.textContent).toBe('Timer starten');
        expect(mounts).toBe(1);
        expect(document.documentElement.lang).toBe('de');
        expect(window.localStorage.getItem('traggo.interface-language')).toBe('de');
        expect(t('Delete user {name}?', {name: 'Alice'})).toBe('Benutzer Alice löschen?');
    } finally {
        act(() => root.unmount());
        setLanguage('en');
        vi.unstubAllGlobals();
    }
});

test('all literal translation keys have complete English and German catalog entries', () => {
    const sources = import.meta.glob<string>('../**/*.{ts,tsx}', {query: '?raw', import: 'default', eager: true});
    for (const [path, source] of Object.entries(sources)) {
        if (path.includes('.test.') || path.includes('__generated__')) {
            continue;
        }
        for (const match of source.matchAll(/\bt\('([^'\n]+)'/g)) {
            expect(messages[match[1]], `Missing translation: ${match[1]}`).toBeDefined();
        }
    }
    for (const [key, value] of Object.entries(messages)) {
        expect(value.en.trim(), key).not.toBe('');
        expect(value.de.trim(), key).not.toBe('');
        expect([...value.en.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort()).toEqual(
            [...value.de.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort()
        );
    }
});
