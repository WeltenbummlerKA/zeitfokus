import Paper from '@mui/material/Paper';
import * as React from 'react';

export const DefaultPaper: React.FC<React.PropsWithChildren> = ({children}) => (
    <Paper sx={{p: {xs: 3, sm: 4}, width: '100%', maxWidth: 440, textAlign: 'left', borderRadius: 3}}>{children}</Paper>
);
