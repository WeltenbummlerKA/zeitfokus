# Private favorites

Favorites are authenticated time-entry templates stored in the server database. Every query and mutation derives the owner from the active Traggo session; the GraphQL input has no user ID or helper token. The new `favorites` table is additive and is removed for an account when the account is deleted. Individual CRUD operations avoid replacing an entire user's list during unrelated changes.

In the entry composer, **Save current entry as favorite** stores the current description and tags with a name. Picking a favorite fills the composer, and the user explicitly starts or saves the entry. **Manage favorites** edits the name and description or deletes a favorite after confirmation. Tags are retained during edits; a new template captures the currently selected tags.

The existing port-3031 helper and its native-client API are unchanged. Existing helper/app favorites are not automatically copied, merged or synchronized with these new server favorites. The browser never receives the helper's global bearer token. Native clients can adopt the new authenticated GraphQL operations separately.
