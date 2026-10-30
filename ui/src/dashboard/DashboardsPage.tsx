import {t, useI18n} from '../i18n';
import * as React from 'react';
import Paper from '@mui/material/Paper';
import {useMutation, useQuery} from '@apollo/client';
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
import * as gqlDashboard from '../gql/dashboard';
import {Link, Typography, TextField} from '@mui/material';
import Button from '@mui/material/Button';
import {
    DashboardsQuery,
    RemoveDashboardMutation,
    RemoveDashboardMutationVariables,
    UpdateDashboardMutation,
    UpdateDashboardMutationVariables,
} from '../gql/__generated__';
import {AddDashboardDialog} from './AddDashboardDialog';
import makeStyles from '@mui/styles/makeStyles';
import {ConfirmDialog} from '../common/ConfirmDialog';
import {Link as RouterLink} from 'react-router-dom';

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

const NoEdit = [-1, ''] as const;

export const DashboardsPage = () => {
    useI18n();
    const classes = useStyles();
    const {loading, data} = useQuery<DashboardsQuery>(gqlDashboard.Dashboards);
    const [addDashboard, setAddDashboard] = React.useState(false);
    const [removeDashboardConfirm, setRemoveDashboardConfirm] = React.useState<false | [number, string]>(false);
    const refetch = {refetchQueries: [{query: gqlDashboard.Dashboards}]};
    const {enqueueSnackbar} = useSnackbar();
    const [removeDashboard] = useMutation<RemoveDashboardMutation, RemoveDashboardMutationVariables>(
        gqlDashboard.RemoveDashboard,
        refetch
    );
    const [[editId, editName], setEditing] = React.useState<Readonly<[number, string]>>(NoEdit);
    const [updateDashboard] = useMutation<UpdateDashboardMutation, UpdateDashboardMutationVariables>(
        gqlDashboard.UpdateDashboard,
        refetch
    );
    if (loading || !data || !data.dashboards) {
        return <CenteredSpinner />;
    }
    const onClickDelete = () => {
        if (removeDashboardConfirm) {
            removeDashboard({variables: {id: removeDashboardConfirm[0]}}).then(() =>
                enqueueSnackbar(t('dashboard deleted'), {variant: 'success'})
            );
        }
    };

    const dashboards = data.dashboards.map((dashboard) => {
        const onClickSubmit = () => {
            setEditing(NoEdit);
            updateDashboard({
                variables: {
                    id: editId,
                    name: editName,
                },
            }).then(() => enqueueSnackbar(t('dashboard edited'), {variant: 'success'}));
        };
        const isEdited = editId === dashboard.id;
        return (
            <TableRow key={dashboard.id}>
                <TableCell>{dashboard.id}</TableCell>
                <TableCell>
                    {isEdited ? (
                        <TextField
                            value={editName}
                            onChange={(e) => setEditing([editId, e.target.value])}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onClickSubmit();
                                }
                            }}
                            onSubmit={onClickSubmit}
                        />
                    ) : (
                        <Link component={RouterLink} to={`/dashboard/${dashboard.id}/${encodeURIComponent(dashboard.name)}`}>
                            {dashboard.name}
                        </Link>
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
                            <IconButton onClick={() => setEditing([dashboard.id, dashboard.name])} title={t('Edit')} size="large">
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setRemoveDashboardConfirm([dashboard.id, dashboard.name])}
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
            <Typography component="h2" variant="h4" sx={{textAlign: 'left', mb: 2}}>
                {t('Saved reports')}
            </Typography>
            <Typography color="text.secondary" sx={{textAlign: 'left', mb: 2}}>
                {t('Save a weekly project overview or compare periods with charts. Your time entries stay unchanged.')}
            </Typography>

            <Button
                color={'primary'}
                variant={'outlined'}
                size="small"
                onClick={() => setAddDashboard(true)}
                fullWidth
                style={{marginBottom: 10}}>
                {t('Create Dashboard')}
            </Button>
            {addDashboard && <AddDashboardDialog open={true} close={() => setAddDashboard(false)} />}
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{t('ID')}</TableCell>
                        <TableCell>{t('Name')}</TableCell>
                        <TableCell style={{width: 150}} />
                    </TableRow>
                </TableHead>
                <TableBody>{dashboards}</TableBody>
            </Table>
            {removeDashboardConfirm ? (
                <ConfirmDialog
                    title={t('Delete dashboard {name}?', {name: removeDashboardConfirm[1]})}
                    fClose={() => setRemoveDashboardConfirm(false)}
                    fOnSubmit={onClickDelete}>
                    <b>{t('This operation cannot be undone.')}</b>{' '}
                    {t('Deleting the dashboard will remove all its dashboard entries.')}
                </ConfirmDialog>
            ) : null}
        </Paper>
    );
};
