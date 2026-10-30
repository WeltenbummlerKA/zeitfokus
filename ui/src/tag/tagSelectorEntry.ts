import {t} from '../i18n';
import {TagsQuery} from '../gql/__generated__';
import {Tag} from '../gql/types';
import {QueryResult} from '@apollo/client';

export interface TagInputError {
    error: string;
    value: string;
}

type SpecialTagState = 'used' | 'new' | 'no_values' | 'all_values_used';
export interface SpecialTag {
    create?: boolean;
    alreadyUsed?: boolean;
    noValues?: boolean;
    allValuesUsed?: boolean;
}

export interface TagSelectorEntry {
    tag: Omit<Tag, 'usages'> & SpecialTag;
    value: string;
}

export interface InputTag {
    key: string;
    value: string;
}

export const toInputTags = (entries: TagSelectorEntry[]): InputTag[] => {
    return entries.map((entry) => ({key: entry.tag.key, value: entry.value}));
};

export const toTagSelectorEntry = (tags: Array<TagSelectorEntry['tag']>, entries: InputTag[]): TagSelectorEntry[] => {
    return entries.map((timerTag): TagSelectorEntry => {
        const definition = tags.find((tag) => tag.key === timerTag.key) || specialTag(timerTag.key, 'new');
        return {
            tag: definition,
            value: timerTag.value,
        };
    });
};

export const specialTag = (name: string, state: SpecialTagState): TagSelectorEntry['tag'] & {usages: 0} => {
    return {
        key: name,
        __typename: 'TagDefinition',
        color: 'gray',
        create: state === 'new',
        alreadyUsed: state === 'used',
        noValues: state === 'no_values',
        allValuesUsed: state === 'all_values_used',
        usages: 0,
    };
};

const tryAdd = (tagsResult: QueryResult<TagsQuery, {}>, entry: string, onlyKeys: boolean): TagSelectorEntry | TagInputError => {
    const [keySomeCase, value, ...other] = entry.split(':');
    const key = keySomeCase.toLowerCase();

    if (other.length || !tagsResult.data || !tagsResult.data.tags) {
        return {error: t('{name} has too many colons', {name: entry}), value: entry};
    }

    const foundTag = tagsResult.data.tags.find((tag) => tag.key === key);

    if (foundTag === undefined) {
        return {error: t('Tag {name} does not exist', {name: key}), value: entry};
    }

    if (onlyKeys && value) {
        return {error: t('Tag {name} cannot have a value here', {name: key}), value: entry};
    }

    if (!onlyKeys && !value) {
        return {error: t('Tag {name} requires a value', {name: key}), value: entry};
    }

    return {tag: foundTag, value: value || ''};
};
interface EntriesAndErrors {
    errors: TagInputError[];
    entries: TagSelectorEntry[];
    usedTags: string[];
}

const groupAndCheckExistence = (onlyKeys: boolean, allowDuplicateKeys: boolean) => {
    return (a: EntriesAndErrors, entry: TagInputError | TagSelectorEntry) => {
        if ('tag' in entry) {
            if (allowDuplicateKeys || a.usedTags.indexOf(entry.tag.key) === -1) {
                a.entries = [...a.entries, entry];
                a.usedTags = [...a.usedTags, entry.tag.key];
            } else {
                a.errors = [
                    ...a.errors,
                    {value: itemLabel(entry, onlyKeys), error: t('Tag {name} is already defined', {name: entry.tag.key})},
                ];
            }
        } else {
            a.errors = [...a.errors, entry];
        }
        return a;
    };
};

export const addValues = (
    newValue: string,
    tagsResult: QueryResult<TagsQuery, {}>,
    selectedEntries: TagSelectorEntry[],
    onlyKeys: boolean,
    allowDuplicateKeys: boolean
): EntriesAndErrors => {
    return newValue
        .split(/\s+/)
        .filter((entry) => entry)
        .map((entry) => tryAdd(tagsResult, entry, onlyKeys))
        .reduce(groupAndCheckExistence(onlyKeys, allowDuplicateKeys), {
            errors: [],
            entries: [],
            usedTags: selectedEntries.map((entry) => entry.tag.key),
        });
};

export const itemLabel = (tag: TagSelectorEntry, onlyShowKey = false) => {
    if (tag.tag.create) {
        return t('Create tag {name}', {name: tag.tag.key});
    }
    if (tag.tag.alreadyUsed) {
        return t('Tag {name} is already defined', {name: tag.tag.key});
    }
    if (tag.tag.noValues) {
        return t('Unknown value {value} of tag {name}', {value: tag.value, name: tag.tag.key});
    }
    if (tag.tag.allValuesUsed) {
        return t('All values of tag {name} are used', {name: tag.tag.key});
    }
    if (onlyShowKey) {
        return tag.tag.key;
    }
    return label(tag);
};

export const label = (tag: TagSelectorEntry) => {
    return `${tag.tag.key}:${tag.value}`;
};
