export type ShortcutAction = 'start' | 'stop' | 'search' | 'new' | 'list' | 'calendar' | 'settings' | 'help';

const actions: Record<string, ShortcutAction> = {
    t: 'start',
    s: 'stop',
    f: 'search',
    n: 'new',
    '1': 'list',
    '2': 'calendar',
    ',': 'settings',
    h: 'help',
};

const physicalShortcutKey = (event: KeyboardEvent): string => {
    if (event.code.startsWith('Key')) {
        return event.code.slice(3).toLowerCase();
    }
    if (event.code.startsWith('Digit')) {
        return event.code.slice(5);
    }
    return event.code === 'Comma' ? ',' : event.key.toLowerCase();
};

export const isTextEntry = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    !!target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]'
    );

// Use one exact modifier combination so browser commands and text composition retain their behavior.
export const shortcutAction = (event: KeyboardEvent, mac: boolean): ShortcutAction | undefined => {
    if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.shiftKey ||
        event.getModifierState('AltGraph') ||
        !event.altKey ||
        (mac ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) ||
        isTextEntry(event.target)
    ) {
        return undefined;
    }
    // Option changes event.key on macOS (for example Option+T becomes †).
    return actions[physicalShortcutKey(event)];
};

export const isApplePlatform = (): boolean => /Mac|iPhone|iPad|iPod/u.test(navigator.platform);
export const shortcutAria = (key: string): string => `${isApplePlatform() ? 'Meta' : 'Control'}+Alt+${key}`;
export const shortcutLabel = (key: string): string => `${isApplePlatform() ? '⌘⌥' : 'Ctrl + Alt + '}${key.toUpperCase()}`;

export const isSubmitShortcut = (event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    repeat: boolean;
    nativeEvent?: {isComposing?: boolean};
}): boolean =>
    event.key === 'Enter' &&
    !event.altKey &&
    !event.shiftKey &&
    !event.repeat &&
    !event.nativeEvent?.isComposing &&
    (isApplePlatform() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey);

export const focusShortcutTarget = (selector: string): boolean => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) {
        return false;
    }
    target.focus();
    target.scrollIntoView?.({block: 'nearest'});
    return true;
};
