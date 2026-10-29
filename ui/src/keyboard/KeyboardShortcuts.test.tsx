import * as React from 'react';
import {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {vi} from 'vitest';
import {KeyboardShortcuts} from './KeyboardShortcuts';
import {shortcutAction, isSubmitShortcut} from './shortcuts';

const notice = vi.fn();
vi.mock('notistack', () => ({useSnackbar: () => ({enqueueSnackbar: notice})}));
vi.mock('../i18n', () => ({useI18n: () => ({language: 'de'})}));

let host: HTMLDivElement;
let root: Root;
const press = (key: string, options: KeyboardEventInit = {}, target: EventTarget = document) => {
    const event = new KeyboardEvent('keydown', {key, ctrlKey: true, altKey: true, bubbles: true, cancelable: true, ...options});
    act(() => {
        target.dispatchEvent(event);
    });
    return event;
};

beforeEach(() => {
    Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
    Object.defineProperty(navigator, 'platform', {value: 'Linux', configurable: true});
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    notice.mockClear();
});
afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
});

const render = (start = vi.fn(), stop = vi.fn(), multiple = false) => {
    act(() =>
        root.render(
            <MemoryRouter initialEntries={['/timesheet/list']}>
                <KeyboardShortcuts />
                <Routes>
                    <Route
                        path="/timesheet/list"
                        element={
                            <>
                                <input data-new-description />
                                <input data-history-search />
                                <button data-start-timer onClick={start}>
                                    Start
                                </button>
                                <section className="running-section">
                                    <button data-stop-timer onClick={stop}>
                                        Stop
                                    </button>
                                    {multiple && (
                                        <button data-stop-timer onClick={stop}>
                                            Other
                                        </button>
                                    )}
                                </section>
                            </>
                        }
                    />
                    <Route path="/help" element={<h1>Help</h1>} />
                    <Route path="/timesheet/calendar" element={<h1>Calendar</h1>} />
                </Routes>
            </MemoryRouter>
        )
    );
};

test('start and stop act once, leave repeat and text editing untouched', () => {
    const start = vi.fn();
    const stop = vi.fn();
    render(start, stop);
    expect(press('t').defaultPrevented).toBe(true);
    press('t', {repeat: true});
    press('s');
    const input = host.querySelector('input')!;
    press('t', {}, input);
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
});

test('search and new entry commands focus their visible fields', () => {
    render();
    press('f');
    expect(document.activeElement).toBe(host.querySelector('[data-history-search]'));
    (document.activeElement as HTMLElement).blur();
    press('n');
    expect(document.activeElement).toBe(host.querySelector('[data-new-description]'));
});

test('several running timers require a deliberate choice and dialogs suspend commands', () => {
    const stop = vi.fn();
    render(vi.fn(), stop, true);
    press('s');
    expect(stop).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(host.querySelector('[data-stop-timer]'));
    expect(notice).toHaveBeenCalledTimes(1);
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    host.appendChild(dialog);
    expect(press('s').defaultPrevented).toBe(false);
});

test('navigation remains available via global shortcuts without intercepting plain browser keys', () => {
    render();
    expect(press('h', {altKey: false}).defaultPrevented).toBe(false);
    press('h');
    expect(host.querySelector('h1')?.textContent).toBe('Help');
    press('2');
    expect(host.querySelector('h1')?.textContent).toBe('Calendar');
});

test('macOS uses Command/Option physical keys; IME, AltGr and wrong modifiers are ignored', () => {
    const mac = new KeyboardEvent('keydown', {key: '†', code: 'KeyT', metaKey: true, altKey: true});
    expect(shortcutAction(mac, true)).toBe('start');
    expect(shortcutAction(mac, false)).toBeUndefined();
    expect(
        shortcutAction(new KeyboardEvent('keydown', {key: 't', ctrlKey: true, altKey: true, isComposing: true}), false)
    ).toBeUndefined();
    const altGr = new KeyboardEvent('keydown', {key: 't', ctrlKey: true, altKey: true});
    Object.defineProperty(altGr, 'getModifierState', {value: (modifier: string) => modifier === 'AltGraph'});
    expect(shortcutAction(altGr, false)).toBeUndefined();
    Object.defineProperty(navigator, 'platform', {value: 'MacIntel', configurable: true});
    expect(isSubmitShortcut({key: 'Enter', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false, repeat: false})).toBe(
        true
    );
    expect(isSubmitShortcut({key: 'Enter', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false, repeat: false})).toBe(
        false
    );
});

test('editable regions, comboboxes and menu targets retain their native keyboard behavior', () => {
    render();
    for (const markup of [
        '<textarea></textarea>',
        '<select></select>',
        '<div contenteditable="true"><span></span></div>',
        '<div role="combobox"></div>',
    ]) {
        const container = document.createElement('div');
        container.innerHTML = markup;
        host.appendChild(container);
        expect(press('h', {}, container.querySelector('span') || container.firstElementChild!).defaultPrevented).toBe(false);
    }
    const menu = document.createElement('div');
    menu.setAttribute('role', 'menu');
    host.appendChild(menu);
    expect(press('h').defaultPrevented).toBe(false);
});
