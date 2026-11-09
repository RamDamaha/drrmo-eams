# Notifications module

Owned tables and endpoints are listed in docs/MODULES.md under "Notifications".
Folder layout: Actions, Contracts, Enums, Events, Http, Jobs, Listeners, Models, Policies, Console, routes.php, NotificationsServiceProvider.php

Emails: build them with `Contracts/EmailMessage` and send with `Contracts/MailSender`. The shared layout is `Views/email.blade.php` (see DESIGN_SYSTEM.md, Emails).
