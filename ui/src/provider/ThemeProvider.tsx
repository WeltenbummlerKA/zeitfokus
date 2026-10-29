import * as React from 'react';
import {createTheme, ThemeProvider as MuiThemeProvider, StyledEngineProvider, Theme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {useSettings} from '../gql/settings';
import {Theme as SettingTheme} from '../gql/__generated__';

declare module '@mui/styles/defaultTheme' {
    interface DefaultTheme extends Theme {}
}

export const createWorkspaceTheme = (dark: boolean, warm = false): Theme => {
    const colours = [
        {canvas: '#f5f5f7', surface: '#ffffff', content: '#1d1d1f', muted: '#51545a'},
        {canvas: '#f6f3ed', surface: '#fffdf8', content: '#29251f', muted: '#665d50'},
        {canvas: '#101114', surface: '#1c1e22', content: '#f5f5f7', muted: '#b1b5be'},
        {canvas: '#171614', surface: '#24211d', content: '#f8f3e9', muted: '#c4bbae'},
    ];
    const {canvas, surface, content, muted} = colours[Number(dark) * 2 + Number(warm)];
    const action = dark ? '#8bbcff' : '#0064d9';
    return createTheme({
        shape: {borderRadius: 12},
        palette: {
            mode: dark ? 'dark' : 'light',
            background: {default: canvas, paper: surface},
            text: {primary: content, secondary: muted},
            primary: {main: action},
            secondary: {main: dark ? '#ff9c94' : '#b42318'},
            error: {main: dark ? '#ff9c94' : '#b42318'},
            success: {main: dark ? '#75d69f' : '#15703b'},
            divider: dark ? '#ffffff24' : '#1d1d1f22',
        },
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: 15,
            h1: {fontSize: '2rem', fontWeight: 650, letterSpacing: '-0.035em'},
            h2: {fontSize: '1.65rem', fontWeight: 650, letterSpacing: '-0.025em'},
            h3: {fontSize: '1.4rem', fontWeight: 600},
            h4: {fontSize: '1.25rem', fontWeight: 600},
            h5: {fontSize: '1.125rem', fontWeight: 600},
            h6: {fontSize: '1rem', fontWeight: 600},
            body1: {fontSize: '0.9375rem', lineHeight: 1.55},
            body2: {fontSize: '0.875rem', lineHeight: 1.5},
            button: {fontSize: '0.9375rem', fontWeight: 600, textTransform: 'none'},
        },
        components: {
            MuiCssBaseline: {styleOverrides: {body: {colorScheme: dark ? 'dark' : 'light'}}},
            MuiPaper: {
                defaultProps: {elevation: 0},
                styleOverrides: {root: {backgroundImage: 'none', border: `1px solid ${dark ? '#ffffff24' : '#1d1d1f22'}`}},
            },
            MuiButton: {
                defaultProps: {disableElevation: true},
                styleOverrides: {root: {minHeight: 44, borderRadius: 9, paddingInline: 18}},
            },
            MuiButtonBase: {styleOverrides: {root: {'&.Mui-focusVisible': {outline: `3px solid ${action}`, outlineOffset: 3}}}},
            MuiIconButton: {styleOverrides: {root: {minWidth: 44, minHeight: 44}}},
            MuiTextField: {defaultProps: {variant: 'outlined'}},
            MuiOutlinedInput: {styleOverrides: {root: {borderRadius: 9}}},
            MuiTableCell: {
                styleOverrides: {
                    root: {fontSize: '0.9375rem', padding: '14px 16px'},
                    head: {fontWeight: 600, color: muted, backgroundColor: canvas},
                },
            },
            MuiTableContainer: {styleOverrides: {root: {overflowX: 'auto', maxWidth: '100%'}}},
            MuiDialog: {styleOverrides: {paper: {borderRadius: 16, maxWidth: 'calc(100% - 32px)', margin: 16}}},
            MuiDialogTitle: {styleOverrides: {root: {fontSize: '1.25rem', fontWeight: 600}}},
            MuiDialogActions: {styleOverrides: {root: {padding: '12px 24px 20px', gap: 8, flexWrap: 'wrap'}}},
            MuiTooltip: {defaultProps: {enterDelay: 400}},
            MuiListItemButton: {styleOverrides: {root: {minHeight: 44}}},
            MuiListItemIcon: {styleOverrides: {root: {minWidth: 36, color: 'inherit'}}},
        },
    });
};
const themes: Record<SettingTheme, Theme> = {
    [SettingTheme.GruvboxDark]: createWorkspaceTheme(true, true),
    [SettingTheme.GruvboxLight]: createWorkspaceTheme(false, true),
    [SettingTheme.MaterialDark]: createWorkspaceTheme(true),
    [SettingTheme.MaterialLight]: createWorkspaceTheme(false),
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const {theme} = useSettings();
    return (
        <StyledEngineProvider injectFirst>
            <MuiThemeProvider theme={themes[theme]}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </StyledEngineProvider>
    );
};
