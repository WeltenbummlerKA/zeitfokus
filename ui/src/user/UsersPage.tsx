import {t, useI18n} from '../i18n';
import * as React from 'react';
import Paper from '@mui/material/Paper';
import {useMutation, useQuery} from '@apollo/client';
import * as gqlUser from '../gql/user';
import {CenteredSpinner} from '../common/CenteredSpinner';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import {useSnackbar} from 'notistack';
import {TextField} from '@mui/material';
import {
    UsersQuery,
    RemoveUserMutation,
    RemoveUserMutationVariables,
    UpdateUserMutation,
    UpdateUserMutationVariables,
} from '../gql/__generated__';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import {AddUserDialog} from './AddUserDialog';
import makeStyles from '@mui/styles/makeStyles';
import {ConfirmDialog} from '../common/ConfirmDialog';

const useStyles = makeStyles((theme) => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
        },
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        textAlign: 'center',
        maxWidth: 800,
        margin: '0 auto',
    },
}));

const NoEdit = [-1, '', '', false] as const;

export const UsersPage = () => {
    useI18n();
    const classes = useStyles();
    const {data, loading} = useQuery<UsersQuery>(gqlUser.Users);
    const [addUser, setAddUser] = React.useState(false);
    const refetch = {refetchQueries: [{query: gqlUser.Users}, {query: gqlUser.CurrentUser}]};
    const {enqueueSnackbar} = useSnackbar();
    const [removeUserConfirmation, setRemoveUserConfirmation] = React.useState<false | [number, string]>(false);
    const [removeUser] = useMutation<RemoveUserMutation, RemoveUserMutationVariables>(gqlUser.RemoveUser, refetch);
    const [[editId, editName, editPass, editAdmin], setEditing] =
        React.useState<Readonly<[number, string, string, boolean]>>(NoEdit);
    const [updateUser] = useMutation<UpdateUserMutation, UpdateUserMutationVariables>(gqlUser.UpdateUser, refetch);
    if (loading || !data || !data.currentUser || !data.users) {
        return <CenteredSpinner />;
    }
    const onClickDelete = () => {
        if (removeUserConfirmation) {
            removeUser({variables: {id: removeUserConfirmation[0]}}).then(() =>
                enqueueSnackbar(t('user deleted'), {variant: 'success'})
            );
        }
    };

    const users = data.users.map((user) => {
        const onClickSubmit = () => {
            setEditing(NoEdit);
            updateUser({
                variables: {
                    id: editId,
                    name: editName,
                    admin: editAdmin,
                    pass: editPass || undefined,
                },
            }).then(() => enqueueSnackbar(t('user edited'), {variant: 'success'}));
        };
        const isCurrent = user.id === data.currentUser!.id;
        const isEdited = editId === user.id;
        const displayName = user.name + (isCurrent ? ' (' + t('current') + ')' : '');
        const adminLabel = t(user.admin ? 'Yes' : 'No');
        return (
            <TableRow selected={isCurrent} key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>
                    {isEdited ? (
                        <TextField
                            value={editName}
                            onChange={(e) => setEditing([editId, e.target.value, '', editAdmin])}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onClickSubmit();
                                }
                            }}
                            onSubmit={onClickSubmit}
                        />
                    ) : (
                        displayName
                    )}
                </TableCell>
                <TableCell>
                    {isEdited ? (
                        <TextField
                            value={editPass}
                            placeholder={t('use old password')}
                            type="password"
                            onChange={(e) => setEditing([editId, editName, e.target.value, editAdmin])}
                        />
                    ) : (
                        '********'
                    )}
                </TableCell>
                <TableCell>
                    {isEdited ? (
                        <Checkbox checked={editAdmin} onChange={(e) => setEditing([editId, editName, '', e.target.checked])} />
                    ) : (
                        adminLabel
                    )}
                </TableCell>
                <TableCell align="right">
                    {isEdited ? (
                        <>
                            <IconButton onClick={onClickSubmit} title={t('Save')} size="large">
                                <DoneIcon />
                            </IconButton>
                            <IconButton onClick={() => setEditing(NoEdit)} title={t('Cancel')} size="large">
                                <CloseIcon />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <IconButton
                                onClick={() => setEditing([user.id, user.name, '', user.admin])}
                                title={t('Edit')}
                                size="large">
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setRemoveUserConfirmation([user.id, user.name])}
                                title={t('Delete')}
                                size="large">
                                <DeleteIcon />
                            </IconButton>
                        </>
                    )}
                </TableCell>
            </TableRow>
        );
    });

    return (
        <Paper elevation={1} square={true} className={classes.root}>
            <Button
                color={'primary'}
                variant={'outlined'}
                size="small"
                onClick={() => setAddUser(true)}
                fullWidth
                style={{marginBottom: 10}}>
                {t('Create User')}
            </Button>
            {addUser && <AddUserDialog open={true} close={() => setAddUser(false)} />}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{t('ID')}</TableCell>
                        <TableCell>{t('Name')}</TableCell>
                        <TableCell>{t('Password')}</TableCell>
                        <TableCell>{t('Admin')}</TableCell>
                        <TableCell style={{width: 150}} />
                    </TableRow>
                </TableHead>
                <TableBody>{users}</TableBody>
            </Table>
            {removeUserConfirmation ? (
                <ConfirmDialog
                    title={t('Delete user {name}?', {name: removeUserConfirmation[1]})}
                    fClose={() => setRemoveUserConfirmation(false)}
                    fOnSubmit={onClickDelete}>
                    <b>{t('This operation cannot be undone.')}</b>{' '}
                    {t('Deleting the user includes deleting dashboards, time spans, tags and devices of that user.')}
                </ConfirmDialog>
            ) : null}
        </Paper>
    );
};
