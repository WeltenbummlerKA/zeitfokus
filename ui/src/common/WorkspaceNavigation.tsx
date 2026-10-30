import * as React from 'react';
import {Box, Button, Link, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';
import {NavLink, useLocation} from 'react-router-dom';
import {helpDestination} from '../help/navigation';
import {shortcutAria} from '../keyboard/shortcuts';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import SpaceDashboardOutlined from '@mui/icons-material/SpaceDashboardOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import SellOutlined from '@mui/icons-material/SellOutlined';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import GroupOutlined from '@mui/icons-material/GroupOutlined';
import HelpOutline from '@mui/icons-material/HelpOutline';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import {Dashboard} from '../gql/types';
import {t, useI18n} from '../i18n';

interface NavigationItemProps {
    to: string;
    title: string;
    icon: React.ReactNode;
    description?: string;
    tooltip?: string;
    onNavigate: () => void;
}
const NavigationItem: React.FC<NavigationItemProps> = ({to, title, icon, description, tooltip, onNavigate}) => (
    <Tooltip title={tooltip ?? description ?? title} placement="right" enterDelay={450} describeChild disableTouchListener>
        <ListItemButton
            component={NavLink}
            to={to}
            end
            onClick={onNavigate}
            sx={{
                borderRadius: 2,
                my: 0.5,
                px: 1.5,
                py: description ? 1.2 : 0.5,
                minHeight: 44,
                border: '1px solid transparent',
                '&.active': {
                    bgcolor: 'var(--nav-active)',
                    borderColor: 'var(--nav-selected-border)',
                    color: 'var(--nav-accent)',
                    boxShadow: 'inset 3px 0 0 var(--nav-accent)',
                },
                '&:hover': {bgcolor: 'var(--nav-hover)'},
                '&.active:hover': {bgcolor: 'var(--nav-active-hover)'},
                '&.Mui-focusVisible': {outline: '2px solid var(--nav-accent)', outlineOffset: 2},
            }}>
            <ListItemIcon sx={{minWidth: 36, color: 'inherit', '& svg': {fontSize: 21}}}>{icon}</ListItemIcon>
            <ListItemText
                primary={title}
                secondary={description}
                primaryTypographyProps={{fontWeight: 550, noWrap: true, fontSize: '0.9375rem'}}
                secondaryTypographyProps={{color: 'inherit', sx: {opacity: 0.8}, fontSize: '0.75rem'}}
            />
        </ListItemButton>
    </Tooltip>
);
const NavigationGroup: React.FC<React.PropsWithChildren<{title: string}>> = ({title, children}) => (
    <Box sx={{mt: 2}}>
        <Typography
            component="h2"
            variant="caption"
            sx={{display: 'block', px: 1.5, mb: 1, fontWeight: 650, letterSpacing: '0.025em'}}>
            {title}
        </Typography>
        <List disablePadding>{children}</List>
    </Box>
);
export const WorkspaceNavigation: React.FC<{
    dashboards: Dashboard[];
    admin: boolean;
    version: string;
    onNavigate: () => void;
}> = ({dashboards, admin, version, onNavigate}) => {
    const {language} = useI18n();
    const location = useLocation();
    const tips =
        language === 'de'
            ? {
                  time: 'Timer starten und vergangene Einträge finden',
                  calendar: 'Deine Zeiteinträge im Kalender ansehen',
                  ai: 'Arbeitszeit mit deinem lokalen KI-Modell zusammenfassen',
                  reports: 'Gespeicherte Auswertungen öffnen und verwalten',
                  settings: 'Sprache, Darstellung und Arbeitszeitprofil einstellen',
                  tags: 'Tags zur Zuordnung deiner Tätigkeiten verwalten',
                  devices: 'Angemeldete Geräte und Zugriffe verwalten',
                  users: 'Benutzerkonten verwalten',
                  help: 'Hilfe zur aktuellen Seite öffnen',
                  info: 'Version und Informationen zu Zeitfokus anzeigen',
              }
            : {
                  time: 'Start timers and find previous entries',
                  calendar: 'View your time entries in the calendar',
                  ai: 'Summarize working time with your local AI model',
                  reports: 'Open and manage saved reports',
                  settings: 'Set language, appearance and work targets',
                  tags: 'Manage tags for your activities',
                  devices: 'Manage signed-in devices and access',
                  users: 'Manage user accounts',
                  help: 'Open help for the current page',
                  info: 'View version and information about Zeitfokus',
              };
    const theme = useTheme();
    const dark = theme.palette.mode === 'dark';
    const accent = dark ? '#b4c49d' : '#526b43';
    return (
        <Box
            sx={{
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                color: 'text.primary',
                '--nav-active': alpha(accent, 0.09),
                '--nav-active-hover': alpha(accent, 0.14),
                '--nav-hover': theme.palette.action.hover,
                '--nav-border': theme.palette.divider,
                '--nav-selected-border': alpha(accent, 0.26),
                '--nav-accent': accent,
            }}>
            <Box sx={{px: 3, pt: 3, pb: 1.5, flexShrink: 0}}>
                <Link
                    component={NavLink}
                    to="/timesheet/list"
                    onClick={onNavigate}
                    underline="none"
                    color="inherit"
                    sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Box component="img" src="/zeitfokus-icon.png" alt="" sx={{width: 56, height: 56}} />
                    <Typography
                        component="span"
                        variant="h5"
                        sx={{fontWeight: 650, fontSize: '1.5rem', letterSpacing: '-0.03em'}}>
                        Zeitfokus
                    </Typography>
                </Link>
                <Link
                    component={NavLink}
                    to="/about"
                    onClick={onNavigate}
                    color="inherit"
                    underline="hover"
                    sx={{display: 'inline-block', mt: 1, ml: '68px', typography: 'caption'}}>
                    {t('Version')} {version}
                </Link>
            </Box>
            <Box sx={{flex: '1 1 auto', overflowY: 'auto', px: 1.5, pb: 2}}>
                <NavigationGroup title={language === 'de' ? 'Arbeitsplatz' : 'Workspace'}>
                    <NavigationItem
                        to="/timesheet/list"
                        tooltip={tips.time}
                        title={t('Time tracking')}
                        description={language === 'de' ? 'Timer und Verlauf' : 'Timers and history'}
                        icon={<ScheduleOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem
                        to="/timesheet/calendar"
                        tooltip={tips.calendar}
                        title={t('Calendar')}
                        icon={<CalendarMonthOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem
                        to="/ai"
                        tooltip={tips.ai}
                        title={language === 'de' ? 'KI' : 'AI'}
                        description={language === 'de' ? 'Arbeitszeit auswerten' : 'Analyze working time'}
                        icon={<AutoAwesomeOutlined />}
                        onNavigate={onNavigate}
                    />
                </NavigationGroup>
                <NavigationGroup title={language === 'de' ? 'Auswertungen' : 'Reports'}>
                    <NavigationItem
                        to="/dashboards"
                        tooltip={tips.reports}
                        title={t('Dashboards')}
                        icon={<SpaceDashboardOutlined />}
                        onNavigate={onNavigate}
                    />
                    {dashboards.map(({id, name}) => (
                        <NavigationItem
                            key={id}
                            to={`/dashboard/${id}/${encodeURIComponent(name)}`}
                            title={name}
                            icon={
                                <Box
                                    component="span"
                                    aria-hidden="true"
                                    sx={{ml: 1, width: 5, height: 5, borderRadius: '50%', bgcolor: 'currentColor'}}
                                />
                            }
                            onNavigate={onNavigate}
                        />
                    ))}
                </NavigationGroup>
                <NavigationGroup title={language === 'de' ? 'Verwalten' : 'Manage'}>
                    <NavigationItem
                        to="/user/settings"
                        tooltip={tips.settings}
                        title={t('Settings')}
                        icon={<SettingsOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem
                        to="/user/tags"
                        tooltip={tips.tags}
                        title={t('Tags')}
                        icon={<SellOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem
                        to="/user/devices"
                        tooltip={tips.devices}
                        title={t('Devices')}
                        icon={<DevicesOutlined />}
                        onNavigate={onNavigate}
                    />
                    {admin && (
                        <NavigationItem
                            to="/admin/users"
                            tooltip={tips.users}
                            title={t('Users')}
                            icon={<GroupOutlined />}
                            onNavigate={onNavigate}
                        />
                    )}
                </NavigationGroup>
            </Box>
            <Box sx={{p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid var(--nav-border)', flexShrink: 0}}>
                <Tooltip title={tips.help} placement="top" enterDelay={450} describeChild disableTouchListener>
                    <Button
                        component={NavLink}
                        to={helpDestination(location.pathname)}
                        variant="outlined"
                        aria-keyshortcuts={shortcutAria('H')}
                        color="inherit"
                        onClick={onNavigate}
                        startIcon={<HelpOutline />}
                        sx={{flex: 1}}>
                        {t('Help')}
                    </Button>
                </Tooltip>
                <Tooltip title={tips.info} placement="top" enterDelay={450} describeChild disableTouchListener>
                    <Button
                        component={NavLink}
                        to="/about"
                        color="inherit"
                        onClick={onNavigate}
                        startIcon={<InfoOutlined />}
                        sx={{flex: 1}}>
                        {language === 'de' ? 'Info' : 'About'}
                    </Button>
                </Tooltip>
            </Box>
        </Box>
    );
};
