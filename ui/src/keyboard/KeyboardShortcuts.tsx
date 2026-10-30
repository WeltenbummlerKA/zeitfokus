import * as React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useSnackbar} from 'notistack';
import {useI18n} from '../i18n';
import {helpDestination} from '../help/navigation';
import {focusShortcutTarget, isApplePlatform, shortcutAction, ShortcutAction} from './shortcuts';

const routes: Partial<Record<ShortcutAction, string>> = {
    list: '/timesheet/list',
    calendar: '/timesheet/calendar',
    settings: '/user/settings',
    help: '/help',
};
const focusTargets = {search: '[data-history-search]', new: '[data-new-description]'};

// Mounted once inside the authenticated shell. All commands retain visible button/link equivalents.
export const KeyboardShortcuts: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {language} = useI18n();
    const {enqueueSnackbar} = useSnackbar();
    const [pendingFocus, setPendingFocus] = React.useState<'search' | 'new' | null>(null);

    React.useEffect(() => {
        if (!pendingFocus || location.pathname !== '/timesheet/list') {
            return;
        }
        const frame = requestAnimationFrame(() => {
            focusShortcutTarget(focusTargets[pendingFocus]);
            setPendingFocus(null);
        });
        return () => cancelAnimationFrame(frame);
    }, [pendingFocus, location.pathname]);

    React.useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const action = shortcutAction(event, isApplePlatform());
            if (!action || document.querySelector('[role="dialog"], [role="menu"], [role="listbox"]')) {
                return;
            }
            const route = action === 'help' ? helpDestination(location.pathname) : routes[action];
            if (route) {
                event.preventDefault();
                navigate(route);
                return;
            }
            if (action === 'new' || action === 'search') {
                event.preventDefault();
                setPendingFocus(action);
                if (location.pathname !== '/timesheet/list') {
                    navigate('/timesheet/list');
                }
                return;
            }
            if (action === 'start') {
                const button = document.querySelector<HTMLButtonElement>('[data-start-timer]');
                if (button && !button.disabled) {
                    event.preventDefault();
                    button.click();
                }
                return;
            }
            const buttons = document.querySelectorAll<HTMLButtonElement>('.running-section [data-stop-timer]');
            if (buttons.length === 0) {
                return;
            }
            event.preventDefault();
            if (buttons.length === 1) {
                if (!buttons[0].disabled) {
                    buttons[0].click();
                }
            } else {
                focusShortcutTarget('.running-section [data-stop-timer]:not(:disabled)');
                enqueueSnackbar(
                    language === 'de'
                        ? 'Mehrere Timer laufen. Wähle den Timer zum Stoppen.'
                        : 'Several timers are running. Choose the timer to stop.',
                    {variant: 'info'}
                );
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [navigate, location.pathname, language, enqueueSnackbar]);
    return null;
};
