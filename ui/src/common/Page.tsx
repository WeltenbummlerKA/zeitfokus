import {t, useI18n} from '../i18n';
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import {LanguageSwitcher} from '../i18n/LanguageSwitcher';
import IconButton from '@mui/material/IconButton';
import UsersIcon from '@mui/icons-material/SupervisorAccount';
import List from '@mui/material/List';

import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import DevicesIcon from '@mui/icons-material/DevicesOther';
import LabelIcon from '@mui/icons-material/Label';
import DashboardManageIcon from '@mui/icons-material/ListAlt';
import TimeLineIcon from '@mui/icons-material/Timeline';
import CalendarIcon from '@mui/icons-material/CalendarToday';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import {ListSubheader, Menu} from '@mui/material';
import HrefLink from '@mui/material/Link';
import * as gqlUser from '../gql/user';
import * as gqlVersion from '../gql/version';
import Button from '@mui/material/Button';
import AccountCircle from '@mui/icons-material/AccountCircle';
import {NavLink, matchPath, useLocation} from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';
import {useMutation, useQuery} from '@apollo/client';
import {LogoutMutation, VersionQuery, CurrentUserQuery, DashboardsQuery} from '../gql/__generated__';
import * as gqlDashboard from '../gql/dashboard';
import {Dashboard} from '../gql/types';

const drawerWidth = 240;

// MUI's `component` prop isn't polymorphism-typed against an arbitrary forwardRef component.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routerLink = (to: string): any => {
    return React.forwardRef<HTMLAnchorElement>((props, ref) => <NavLink ref={ref} to={to} {...props} />);
};

const staticPageTitles: Array<{path: string; title: string}> = [
    {path: '/timesheet/list', title: 'Time tracking'},
    {path: '/timesheet/calendar', title: 'Timesheet / Calendar'},
    {path: '/user/settings', title: 'User / Settings'},
    {path: '/user/devices', title: 'User / Devices'},
    {path: '/user/tags', title: 'User / Tags'},
    {path: '/admin/users', title: 'Admin / Users'},
    {path: '/dashboards', title: 'Dashboards / Manage'},
];

const getPageTitle = (pathname: string, dashboards: Dashboard[]): string => {
    for (const {path, title} of staticPageTitles) {
        if (matchPath(path, pathname)) {
            return t(title);
        }
    }
    const dashboardMatch = matchPath('/dashboard/:id/*', pathname);
    if (dashboardMatch && dashboardMatch.params.id) {
        const db = dashboards.find((dashboard) => dashboard.id === parseInt(dashboardMatch.params.id!, 10));
        return t('Dashboards') + ' / ' + (db ? db.name : '...');
    }
    return '';
};

export const Page: React.FC<React.PropsWithChildren> = ({children}) => {
    useI18n();

    const {data} = useQuery<CurrentUserQuery>(gqlUser.CurrentUser);

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const headerRef = React.useRef<HTMLElement>(null);
    const [headerHeight, setHeaderHeight] = React.useState(80);
    React.useLayoutEffect(() => {
        const header = headerRef.current;
        if (!header) {
            return;
        }
        const measure = () => setHeaderHeight(header.getBoundingClientRect().height);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(header);
        return () => observer.disconnect();
    }, []);
    const [userMenuOpen, setUserMenuOpen] = React.useState<null | HTMLElement>(null);
    const [logout] = useMutation<LogoutMutation>(gqlUser.Logout, {refetchQueries: [{query: gqlUser.CurrentUser}]});
    const {data: {version = gqlVersion.VersionDefault.version} = gqlVersion.VersionDefault} = useQuery<VersionQuery>(
        gqlVersion.Version
    );
    const dashboardsQuery = useQuery<DashboardsQuery>(gqlDashboard.Dashboards);
    const dashboards = (dashboardsQuery.data && dashboardsQuery.data.dashboards) || [];

    const username = (data && data.user && data.user.name) || 'unknown';
    const admin = data && data.user && data.user.admin;

    const location = useLocation();
    const pageTitle = getPageTitle(location.pathname, dashboards);

    const drawer = (
        <div className="workspace-navigation">
            <Box sx={{p: 3, minHeight: 104}}>
                <HrefLink href="https://github.com/traggo" underline="none" target="_blank">
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25}}>
                        <Box component="img" src="/favicon.ico" alt="" aria-hidden="true" sx={{width: 30, height: 30}} />
                        <Typography variant="h5" align="center" color="textPrimary">
                            traggo
                        </Typography>
                    </Box>
                </HrefLink>
                <HrefLink href="https://github.com/traggo/server/releases" underline="none" target="_blank">
                    <Typography variant="caption" align="center" color="textPrimary">
                        {version.name}@{version.commit.slice(0, 8)}
                    </Typography>
                </HrefLink>
            </Box>
            <Divider />
            <List subheader={<ListSubheader>{t('Timesheet')}</ListSubheader>} dense={true}>
                <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink('/timesheet/list')}>
                    <ListItemIcon>
                        <TimeLineIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('List')} />
                </ListItemButton>
                <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink('/timesheet/calendar')}>
                    <ListItemIcon>
                        <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Calendar')} />
                </ListItemButton>
            </List>
            <Divider />
            <List subheader={<ListSubheader>{t('Dashboards')}</ListSubheader>} dense={true}>
                {dashboards.map(({id, name}) => (
                    <ListItemButton
                        role="link"
                        key={id}
                        onClick={() => setMobileOpen(false)}
                        component={routerLink(`/dashboard/${id}/${encodeURIComponent(name)}`)}>
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary={name} />
                    </ListItemButton>
                ))}
                {dashboards.length === 0 ? (
                    <ListItemButton disabled={true}>
                        <ListItemText primary={t('no dashboards added')} />
                    </ListItemButton>
                ) : null}
                <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink(`/dashboards`)}>
                    <ListItemIcon>
                        <DashboardManageIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Manage')} />
                </ListItemButton>
            </List>
            <Divider />
            <List subheader={<ListSubheader>{t('User')}</ListSubheader>} dense={true}>
                <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink('/user/tags')}>
                    <ListItemIcon>
                        <LabelIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Tags')} />
                </ListItemButton>
                <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink('/user/devices')}>
                    <ListItemIcon>
                        <DevicesIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Devices')} />
                </ListItemButton>
                <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink('/user/settings')}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Settings')} />
                </ListItemButton>
            </List>
            {admin ? (
                <>
                    <Divider />
                    <List subheader={<ListSubheader>{t('Admin')}</ListSubheader>} dense={true}>
                        <ListItemButton role="link" onClick={() => setMobileOpen(false)} component={routerLink('/admin/users')}>
                            <ListItemIcon>
                                <UsersIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Users')} />
                        </ListItemButton>
                    </List>
                </>
            ) : null}
            <Divider />
        </div>
    );

    React.useEffect(() => {
        document.title = `${pageTitle} · traggo`;
    }, [pageTitle]);
    return (
        <Box sx={{display: 'flex', minHeight: '100%'}}>
            <CssBaseline />
            <a className="skip-link" href="#main-content">
                {t('Skip to content')}
            </a>
            <AppBar
                ref={headerRef}
                position="fixed"
                color="default"
                elevation={0}
                sx={{
                    ml: {md: `${drawerWidth}px`},
                    width: {md: `calc(100% - ${drawerWidth}px)`},
                    borderBottom: 1,
                    borderColor: 'divider',
                }}>
                <Toolbar sx={{gap: 1, flexWrap: 'wrap', py: 1}}>
                    <IconButton
                        aria-label={t('Open drawer')}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        sx={{display: {md: 'none'}}}>
                        <MenuIcon />
                    </IconButton>
                    <Typography component="h1" variant="h6" sx={{flex: '1 1 140px'}}>
                        {pageTitle}
                    </Typography>
                    <LanguageSwitcher />
                    <Button
                        color="inherit"
                        sx={{color: 'text.primary'}}
                        aria-haspopup="menu"
                        onClick={(e) => setUserMenuOpen(e.currentTarget)}
                        startIcon={<AccountCircle />}>
                        {username}
                    </Button>
                    <Menu anchorEl={userMenuOpen} open={!!userMenuOpen} onClose={() => setUserMenuOpen(null)}>
                        <MenuItem component={routerLink('/user/settings')} onClick={() => setUserMenuOpen(null)}>
                            {t('Settings')}
                        </MenuItem>
                        <MenuItem component={routerLink('/about')} onClick={() => setUserMenuOpen(null)}>
                            {t('About')}
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                setUserMenuOpen(null);
                                void logout();
                            }}>
                            {t('Logout')}
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>
            <Box component="nav" aria-label={t('Main navigation')} sx={{width: {md: drawerWidth}, flexShrink: {md: 0}}}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    sx={{display: {xs: 'block', md: 'none'}, '& .MuiDrawer-paper': {width: drawerWidth}}}>
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{display: {xs: 'none', md: 'block'}, '& .MuiDrawer-paper': {width: drawerWidth}}}
                    open>
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                id="main-content"
                style={{paddingTop: headerHeight + 24}}
                tabIndex={-1}
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    p: {xs: 2, sm: 3, lg: 4},
                }}>
                {children}
            </Box>
        </Box>
    );
};
