import {t, useI18n} from '../i18n';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';

interface Props {
    title: string;
    fClose: () => void;
    fOnSubmit: () => void;
}

export const ConfirmDialog: React.FC<React.PropsWithChildren<Props>> = ({children, title, fClose, fOnSubmit}) => {
    useI18n();
    const submitAndClose = () => {
        fOnSubmit();
        fClose();
    };
    return (
        <Dialog open={true} onClose={fClose} aria-labelledby="form-dialog-title" className="confirm-dialog">
            <DialogTitle id="form-dialog-title">{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{children}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={fClose} className="cancel">
                    {t('No')}
                </Button>
                <Button onClick={submitAndClose} autoFocus color="primary" variant="contained" className="confirm">
                    {t('Yes')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
