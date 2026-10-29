import {useSyncExternalStore} from 'react';
import {messages} from './messages';

export type Language = 'de' | 'en';
const storageKey = 'traggo.interface-language';
const listeners = new Set<() => void>();
const browserLanguage = (): Language =>
    typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
const initialLanguage = (): Language => {
    try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved === 'de' || saved === 'en') {
            return saved;
        }
    } catch {
        /* Storage can be unavailable in private or restricted contexts. */
    }
    return browserLanguage();
};
let state = {language: initialLanguage(), saving: false};
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const snapshot = () => state;
const serverState = {language: 'en' as Language, saving: false};
const serverSnapshot = () => serverState;

export const setLanguage = (language: Language) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
    }
    try {
        window.localStorage.setItem(storageKey, language);
    } catch {
        /* Preference still works for this session. */
    }
    if (state.language === language) {
        return;
    }
    state = {...state, language};
    listeners.forEach((listener) => listener());
};
export const setLanguageSaving = (saving: boolean) => {
    if (saving === state.saving) {
        return;
    }
    state = {...state, saving};
    listeners.forEach((listener) => listener());
};
export const t = (message: string, values: Record<string, string | number> = {}): string => {
    const translated = messages[message]?.[state.language] ?? message;
    return translated.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
};
export const useI18n = () => ({...useSyncExternalStore(subscribe, snapshot, serverSnapshot), setLanguage, t});
if (typeof document !== 'undefined') {
    document.documentElement.lang = state.language;
}
