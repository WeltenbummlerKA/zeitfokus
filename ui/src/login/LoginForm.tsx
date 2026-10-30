import {t, useI18n} from '../i18n';
import * as React from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {useSnackbar} from 'notistack';
import {handleError} from '../utils/errors';
import * as gqlUser from '../gql/user';
import {LoginMutation, LoginMutationVariables, DeviceType} from '../gql/__generated__';
import {useMutation} from '@apollo/client';
import {Checkbox} from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import makeStyles from '@mui/styles/makeStyles';
import {Settings as SettingsGQL} from '../gql/settings';

const useStyles = makeStyles((theme) => ({
    button: {
        marginTop: theme.spacing(1),
    },
}));

export const LoginForm = () => {
    useI18n();
    const classes = useStyles();
    const [login, {loading}] = useMutation<LoginMutation, LoginMutationVariables>(gqlUser.Login, {
        update: (cache, {data}) => {
            cache.writeQuery({query: gqlUser.CurrentUser, data: {user: data && data.login && data.login.user}});
        },
        refetchQueries: [{query: SettingsGQL}],
    });

    const {enqueueSnackbar} = useSnackbar();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [remember, setRemember] = React.useState(false);
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) {
            return;
        }
        login({
            variables: {
                name: username,
                pass: password,
                deviceType: remember ? DeviceType.LongExpiry : DeviceType.ShortExpiry,
            },
        })
            .then(() => enqueueSnackbar(t('Login successful'), {variant: 'success'}))
            .catch(handleError(t('Login failed'), enqueueSnackbar));
    };
    return (
        <form onSubmit={submit}>
            <TextField
                required
                margin="dense"
                variant="outlined"
                label={t('username')}
                autoComplete="username"
                autoFocus
                fullWidth
                onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
                required
                type="password"
                autoComplete="current-password"
                margin="dense"
                variant="outlined"
                label={t('password')}
                fullWidth
                onChange={(e) => setPassword(e.target.value)}
            />
            <FormControlLabel
                sx={{my: 1}}
                control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
                label={t('Remember Me')}
            />
            <Button
                type="submit"
                className={classes.button}
                fullWidth
                size="large"
                disabled={loading || !username || !password}
                variant="contained"
                color="primary">
                {t('Login')}
            </Button>
        </form>
    );
};
