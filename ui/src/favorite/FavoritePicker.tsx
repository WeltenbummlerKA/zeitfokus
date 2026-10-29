import * as React from 'react';
import {useMutation, useQuery} from '@apollo/client';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {CreateFavorite, Favorites, RemoveFavorite, UpdateFavorite} from '../gql/favorites';
import {Tags} from '../gql/tags';
import {
    CreateFavoriteMutation,
    CreateFavoriteMutationVariables,
    FavoritesQuery,
    InputFavorite,
    RemoveFavoriteMutation,
    RemoveFavoriteMutationVariables,
    TagsQuery,
    UpdateFavoriteMutation,
    UpdateFavoriteMutationVariables,
} from '../gql/__generated__';
import {TagSelectorEntry, toInputTags, toTagSelectorEntry} from '../tag/tagSelectorEntry';
import {useI18n} from '../i18n';

const labels = {
    de: {
        title: 'Favoriten',
        manage: 'Favoriten verwalten',
        add: 'Aktuelle Eingabe als Favorit',
        name: 'Name',
        note: 'Beschreibung',
        save: 'Speichern',
        cancel: 'Abbrechen',
        close: 'Schließen',
        edit: 'Bearbeiten',
        remove: 'Löschen',
        confirm: 'Favorit löschen?',
        error: 'Favoriten konnten nicht geladen oder gespeichert werden. Bitte erneut versuchen.',
        retry: 'Erneut laden',
        empty: 'Noch keine Favoriten. Speichere eine Tätigkeit mit ihren Tags als Vorlage.',
        privacy:
            'Deine Favoriten werden für dein Benutzerkonto auf diesem Server gespeichert. Die Synchronisation mit den bisherigen App-Favoriten ist noch nicht verbunden.',
    },
    en: {
        title: 'Favorites',
        manage: 'Manage favorites',
        add: 'Save current entry as favorite',
        name: 'Name',
        note: 'Description',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        edit: 'Edit',
        remove: 'Delete',
        confirm: 'Delete favorite?',
        error: 'Could not load or save favorites. Please retry.',
        retry: 'Reload',
        empty: 'No favorites yet. Save an activity and its tags as a template.',
        privacy:
            'Your favorites are stored for your user account on this server. Synchronization with existing app favorites is not connected yet.',
    },
};
type Entry = FavoritesQuery['favorites'][number];
interface FavoritePickerProps {
    note: string;
    tags: TagSelectorEntry[];
    onSelect: (note: string, tags: TagSelectorEntry[]) => void;
}

export const FavoritePicker: React.FC<FavoritePickerProps> = ({note, tags, onSelect}) => {
    const {language} = useI18n();
    const text = labels[language];
    const favorites = useQuery<FavoritesQuery>(Favorites, {fetchPolicy: 'cache-and-network'});
    const definitions = useQuery<TagsQuery>(Tags);
    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<number | null>(null);
    const [draft, setDraft] = React.useState<InputFavorite | null>(null);
    const [remove, setRemove] = React.useState<Entry | null>(null);
    const [failed, setFailed] = React.useState(false);
    const options = {refetchQueries: [{query: Favorites}], awaitRefetchQueries: true};
    const [create, creating] = useMutation<CreateFavoriteMutation, CreateFavoriteMutationVariables>(CreateFavorite, options);
    const [update, updating] = useMutation<UpdateFavoriteMutation, UpdateFavoriteMutationVariables>(UpdateFavorite, options);
    const [deleteFavorite, deleting] = useMutation<RemoveFavoriteMutation, RemoveFavoriteMutationVariables>(
        RemoveFavorite,
        options
    );
    const busy = creating.loading || updating.loading || deleting.loading;
    const entries = favorites.data?.favorites ?? [];
    const begin = (entry?: Entry) => {
        setEditing(entry?.id ?? null);
        setDraft(
            entry
                ? {
                      title: entry.title,
                      note: entry.note,
                      tags: entry.tags.map(({key, value}) => ({key, value})),
                      position: entry.position,
                  }
                : {title: note.trim().slice(0, 100), note, tags: toInputTags(tags), position: entries.length}
        );
        setFailed(false);
        setOpen(true);
    };
    const save = async () => {
        if (!draft || busy) {
            return;
        }
        setFailed(false);
        try {
            if (editing === null) {
                await create({variables: {input: draft}});
            } else {
                await update({variables: {id: editing, input: draft}});
            }
            setDraft(null);
        } catch {
            setFailed(true);
        }
    };
    return (
        <Box sx={{width: '100%'}}>
            <Stack direction="row" sx={{gap: 1, alignItems: 'center', flexWrap: 'wrap'}}>
                <Typography variant="body2" fontWeight={600}>
                    {text.title}
                </Typography>
                {entries.map((entry) => (
                    <Chip
                        key={entry.id}
                        label={entry.title}
                        disabled={definitions.loading || !!definitions.error}
                        onClick={() => onSelect(entry.note, toTagSelectorEntry(definitions.data?.tags ?? [], entry.tags))}
                    />
                ))}
                <Button
                    size="small"
                    onClick={() => {
                        setOpen(true);
                        setFailed(false);
                    }}>
                    {text.manage}
                </Button>
                <Button size="small" onClick={() => begin()}>
                    {text.add}
                </Button>
            </Stack>
            {favorites.error && (
                <Alert
                    severity="error"
                    action={<Button onClick={() => void favorites.refetch().catch(() => {})}>{text.retry}</Button>}>
                    {text.error}
                </Alert>
            )}
            <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>{text.manage}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                        {text.privacy}
                    </Typography>
                    {failed && (
                        <Alert severity="error" sx={{mb: 2}}>
                            {text.error}
                        </Alert>
                    )}
                    {entries.length === 0 && (
                        <Typography color="text.secondary" sx={{my: 2}}>
                            {text.empty}
                        </Typography>
                    )}
                    <Stack spacing={1}>
                        {entries.map((entry) => (
                            <Box key={entry.id} sx={{display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap'}}>
                                <Typography sx={{flex: '1 1 160px', overflowWrap: 'anywhere'}}>{entry.title}</Typography>
                                <Button disabled={busy} onClick={() => begin(entry)}>
                                    {text.edit}
                                </Button>
                                <Button
                                    disabled={busy}
                                    color="error"
                                    onClick={() => {
                                        setRemove(entry);
                                        setFailed(false);
                                    }}>
                                    {text.remove}
                                </Button>
                            </Box>
                        ))}
                    </Stack>
                    <Button disabled={busy} sx={{my: 2}} onClick={() => begin()}>
                        {text.add}
                    </Button>
                    {draft && (
                        <Stack spacing={2}>
                            <TextField
                                autoFocus
                                label={text.name}
                                value={draft.title}
                                inputProps={{maxLength: 100}}
                                disabled={busy}
                                onChange={(event) => setDraft({...draft, title: event.target.value})}
                            />
                            <TextField
                                label={text.note}
                                value={draft.note}
                                multiline
                                minRows={2}
                                inputProps={{maxLength: 500}}
                                disabled={busy}
                                onChange={(event) => setDraft({...draft, note: event.target.value})}
                            />
                            <Stack direction="row" spacing={1}>
                                <Button disabled={busy || !draft.title.trim()} variant="contained" onClick={() => void save()}>
                                    {text.save}
                                </Button>
                                <Button disabled={busy} onClick={() => setDraft(null)}>
                                    {text.cancel}
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={() => setOpen(false)}>
                        {text.close}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={!!remove} onClose={() => !busy && setRemove(null)}>
                <DialogTitle>{text.confirm}</DialogTitle>
                <DialogContent>
                    <Typography>{remove?.title}</Typography>
                    {failed && <Alert severity="error">{text.error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button disabled={busy} onClick={() => setRemove(null)}>
                        {text.cancel}
                    </Button>
                    <Button
                        disabled={busy}
                        color="error"
                        onClick={() => {
                            if (!remove || busy) {
                                return;
                            }
                            setFailed(false);
                            void deleteFavorite({variables: {id: remove.id}})
                                .then(() => {
                                    setRemove(null);
                                    setDraft(null);
                                })
                                .catch(() => setFailed(true));
                        }}>
                        {text.remove}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
