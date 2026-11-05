# Records module

Owned tables and endpoints are listed in docs/MODULES.md under "Records".
Folder layout: Actions, Contracts, Enums, Events, Http, Jobs, Listeners, Models, Policies, Console, routes.php, RecordsServiceProvider.php

## Contracts (stubbed in M0)

- `Contracts/AuditLogger::log($action, $entity, $entityId, $meta)` writes one row to `audit_logs`. The actor is the signed-in user, or null for jobs. Rows are insert only; the model throws on update or delete.
- `Contracts/ConsentChecker::has($user, ConsentPurpose)` is true when the latest consent for that purpose is not withdrawn.

`RecordsServiceProvider` binds both to the database implementations in `Services/`. Other modules type-hint the interfaces and never touch the tables.
