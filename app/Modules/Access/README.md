# Access module

Owned tables and endpoints are listed in docs/MODULES.md under "Access".
Folder layout: Actions, Contracts, Enums, Events, Http, Jobs, Listeners, Models, Policies, Console, routes.php, AccessServiceProvider.php

## Roles and permissions

`Support/PermissionMatrix.php` is the source of truth for permission codes and which role holds each one. `RoleSeeder` and `PermissionSeeder` write it to the database and can be run again safely. A test compares the seeded data with the table in docs/SECURITY_AND_PRIVACY.md, so change both together.

Admin and Director share the `admin` role for now. To split them, add a `Director` case to the `Role` enum, give it a column in the docs matrix, and list it in `PermissionMatrix`.
