import * as React from 'react';
import {useMutation, useQuery} from '@apollo/client';
import {TextField} from '@mui/material';
import {useSnackbar} from 'notistack';
import {CurrentUser} from '../gql/user';
import {Settings, SetInterfaceLanguage} from '../gql/settings';
import {
    CurrentUserQuery,
    InterfaceLanguage,
    SetInterfaceLanguageMutation,
    SetInterfaceLanguageMutationVariables,
} from '../gql/__generated__';
import {Language, setLanguageSaving, t, useI18n} from './index';

export const LanguageSwitcher: React.FC<{formField?: boolean}> = ({formField = false}) => {
    const {language, saving, setLanguage} = useI18n();
    const {data} = useQuery<CurrentUserQuery>(CurrentUser);
    const {enqueueSnackbar} = useSnackbar();
    const [save] = useMutation<SetInterfaceLanguageMutation, SetInterfaceLanguageMutationVariables>(SetInterfaceLanguage, {
        update(cache, {data: result}) {
            if (result) {
                cache.writeQuery({query: Settings, data: {userSettings: result.setInterfaceLanguage}});
            }
        },
    });
    const id = React.useId();
    const change = async (next: Language) => {
        if (next === language || saving) {
            return;
        }
        const previous = language;
        setLanguage(next);
        if (!data?.user) {
            return;
        }
        setLanguageSaving(true);
        try {
            await save({variables: {language: next === 'de' ? InterfaceLanguage.German : InterfaceLanguage.English}});
        } catch {
            setLanguage(previous);
            enqueueSnackbar(t('Language could not be saved'), {variant: 'error'});
        } finally {
            setLanguageSaving(false);
        }
    };
    const options = (
        <>
            <option value="de" lang="de">
                Deutsch
            </option>
            <option value="en" lang="en">
                English
            </option>
        </>
    );
    if (formField) {
        return (
            <TextField
                select
                fullWidth
                label={t('Interface language')}
                value={language}
                disabled={saving}
                SelectProps={{native: true}}
                onChange={(event) => {
                    void change(event.target.value as Language);
                }}>
                {options}
            </TextField>
        );
    }
    return (
        <div className="language-control">
            <label htmlFor={id} className="visually-hidden">
                {t('Interface language')}
            </label>
            <select
                id={id}
                value={language}
                disabled={saving}
                onChange={(event) => {
                    void change(event.target.value as Language);
                }}>
                {options}
            </select>
        </div>
    );
};
