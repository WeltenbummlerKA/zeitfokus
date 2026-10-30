import {t, useI18n} from '../i18n';
import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {HexColorPicker} from 'react-colorful';
import {InputLabel} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import {FetchResult, useMutation} from '@apollo/client';
import {AddTagMutation, AddTagMutationVariables} from '../gql/__generated__';
import * as gqlTags from '../gql/tags';
import {TagSelectorEntry} from './tagSelectorEntry';
import {useSnackbar} from 'notistack';
import {handleError} from '../utils/errors';

interface AddTagDialogProps {
    initialName: string;
    open: boolean;
    close: () => void;
    onAdded?: (tag: TagSelectorEntry['tag']) => void;
}

export const AddTagDialog: React.FC<AddTagDialogProps> = ({close, open, initialName, onAdded = () => {}}) => {
    useI18n();
    const [name, setName] = React.useState(initialName);
    const [color, setColor] = React.useState('#e6b3b3');
    const {enqueueSnackbar} = useSnackbar();

    const [addTag] = useMutation<AddTagMutation, AddTagMutationVariables>(gqlTags.AddTag, {
        refetchQueries: [{query: gqlTags.Tags}],
    });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        addTag({variables: {name, color}})
            .then((result: FetchResult<AddTagMutation> | void) => {
                close();
                if (result && result.data && result.data.createTag) {
                    onAdded(result.data.createTag);
                }
            })
            .catch(handleError(t('Add Tag'), enqueueSnackbar));
    };

    return (
        <Dialog open={open} onClose={close} aria-labelledby="form-dialog-title" fullWidth>
            <form onSubmit={submit} noValidate autoComplete="off">
                <DialogTitle id="form-dialog-title">{t('Create Tag')}</DialogTitle>
                <DialogContent>
                    <DialogContentText />
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label={t('Name')}
                        type="text"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel htmlFor="color-picker" shrink={true}>
                            {t('Color')}
                        </InputLabel>
                        <div id="color-picker" style={{marginTop: 25}}>
                            <HexColorPicker onChange={setColor} color={color} />
                        </div>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={close} color="primary">
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" onClick={submit} color="primary">
                        {t('Create Tag')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
