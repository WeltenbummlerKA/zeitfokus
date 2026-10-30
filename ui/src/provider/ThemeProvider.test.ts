import {getContrastRatio} from '@mui/material/styles';
import {createWorkspaceTheme} from './ThemeProvider';
test('text and action colours maintain readable contrast in every existing theme preference', () => {
    for (const dark of [false, true]) {
        for (const warm of [false, true]) {
            const {palette} = createWorkspaceTheme(dark, warm);
            for (const background of [palette.background.default, palette.background.paper]) {
                expect(getContrastRatio(palette.text.primary, background)).toBeGreaterThanOrEqual(4.5);
                expect(getContrastRatio(palette.text.secondary, background)).toBeGreaterThanOrEqual(4.5);
                expect(getContrastRatio(palette.primary.main, background)).toBeGreaterThanOrEqual(4.5);
            }
        }
    }
});
