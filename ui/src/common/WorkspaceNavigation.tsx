import * as React from 'react';
import {Box, Button, Link, List, ListItemButton, ListItemIcon, ListItemText, Typography} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import {NavLink} from 'react-router-dom';
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
    onNavigate: () => void;
}
const NavigationItem: React.FC<NavigationItemProps> = ({to, title, icon, description, onNavigate}) => (
    <ListItemButton
        component={NavLink}
        to={to}
        end
        onClick={onNavigate}
        title={title}
        sx={{
            borderRadius: 2,
            my: 0.5,
            px: 1.5,
            py: description ? 1.2 : 0.5,
            minHeight: 44,
            border: '1px solid transparent',
            '&.active': {
                bgcolor: 'var(--nav-active)',
                borderColor: 'var(--nav-border)',
                boxShadow: 'inset 3px 0 0 var(--nav-accent)',
            },
            '&:hover': {bgcolor: 'var(--nav-hover)'},
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
    const dark = useTheme().palette.mode === 'dark';
    return (
        <Box
            sx={{
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: dark ? '#17211d' : '#eff4f0',
                color: dark ? '#dce9e1' : '#244537',
                '--nav-active': dark ? '#2b4537' : '#dcebe0',
                '--nav-hover': dark ? '#22362b' : '#e3ede5',
                '--nav-border': dark ? '#52725e' : '#b6ccbd',
                '--nav-accent': dark ? '#9ac5a8' : '#3e6b50',
            }}>
            <Box sx={{px: 3, pt: 3, pb: 1.5, flexShrink: 0}}>
                <Link
                    component={NavLink}
                    to="/timesheet/list"
                    onClick={onNavigate}
                    underline="none"
                    color="inherit"
                    sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Box component="img" src="/zeitfokus-icon.png" alt="" sx={{width: 42, height: 42}} />
                    <Typography component="span" variant="h5" sx={{fontWeight: 650, letterSpacing: '-0.03em'}}>
                        Zeitfokus
                    </Typography>
                </Link>
                <Link
                    component={NavLink}
                    to="/about"
                    onClick={onNavigate}
                    color="inherit"
                    underline="hover"
                    sx={{display: 'inline-block', mt: 1, ml: '54px', typography: 'caption'}}>
                    {t('Version')} {version}
                </Link>
            </Box>
            <Box sx={{flex: '1 1 auto', overflowY: 'auto', px: 1.5, pb: 2}}>
                <NavigationGroup title={language === 'de' ? 'Arbeitsplatz' : 'Workspace'}>
                    <NavigationItem
                        to="/timesheet/list"
                        title={t('Time tracking')}
                        description={language === 'de' ? 'Timer und Verlauf' : 'Timers and history'}
                        icon={<ScheduleOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem
                        to="/timesheet/calendar"
                        title={t('Calendar')}
                        icon={<CalendarMonthOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem
                        to="/ai"
                        title={language === 'de' ? 'KI' : 'AI'}
                        description={language === 'de' ? 'Arbeitszeit auswerten' : 'Analyze working time'}
                        icon={<AutoAwesomeOutlined />}
                        onNavigate={onNavigate}
                    />
                </NavigationGroup>
                <NavigationGroup title={language === 'de' ? 'Auswertungen' : 'Reports'}>
                    <NavigationItem
                        to="/dashboards"
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
                        title={t('Settings')}
                        icon={<SettingsOutlined />}
                        onNavigate={onNavigate}
                    />
                    <NavigationItem to="/user/tags" title={t('Tags')} icon={<SellOutlined />} onNavigate={onNavigate} />
                    <NavigationItem to="/user/devices" title={t('Devices')} icon={<DevicesOutlined />} onNavigate={onNavigate} />
                    {admin && (
                        <NavigationItem to="/admin/users" title={t('Users')} icon={<GroupOutlined />} onNavigate={onNavigate} />
                    )}
                </NavigationGroup>
            </Box>
            <Box sx={{p: 1.5, display: 'flex', gap: 1, borderTop: '1px solid var(--nav-border)', flexShrink: 0}}>
                <Button
                    component={NavLink}
                    to="/help"
                    color="inherit"
                    onClick={onNavigate}
                    startIcon={<HelpOutline />}
                    sx={{flex: 1}}>
                    {t('Help')}
                </Button>
                <Button
                    component={NavLink}
                    to="/about"
                    color="inherit"
                    onClick={onNavigate}
                    startIcon={<InfoOutlined />}
                    sx={{flex: 1}}>
                    {language === 'de' ? 'Info' : 'About'}
                </Button>
            </Box>
        </Box>
    );
};
