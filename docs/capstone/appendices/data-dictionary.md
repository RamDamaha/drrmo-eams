# Data Dictionary

Filled in per milestone. See ../../DOCUMENTATION_GUIDE.md. Types are shown as Laravel column types.

## M0 tables

### roles (Access)
| Column | Type | Notes |
|---|---|---|
| id | bigint | primary key |
| code | string(32) | unique: admin, marshal, volunteer, coordinator |
| name | string(64) | display name |

### permissions (Access)
| Column | Type | Notes |
|---|---|---|
| id | bigint | primary key |
| code | string(64) | unique, for example `location.view` |
| description | string | what it allows |
| grantable | boolean | true when the admin may grant it for a limited time |

### role_permission (Access)
| Column | Type | Notes |
|---|---|---|
| role_id | foreign key | cascade on delete |
| permission_id | foreign key | cascade on delete, unique with role_id |

### departments (Personnel)
| Column | Type | Notes |
|---|---|---|
| id | bigint | primary key |
| name | string | unique |

### users (Personnel)
| Column | Type | Notes |
|---|---|---|
| id | bigint | primary key |
| name | string | |
| email | string | unique, used to log in |
| contact_number | string(32) | optional |
| role_id | foreign key | restrict on delete |
| department_id | foreign key | optional, restrict on delete |
| team | string(32) | optional: security, ert, fire_suppression |
| status | string(16) | on-call availability: active or inactive |
| password | string | hashed |
| email_verified_at, last_login_at, disabled_at | timestamp | optional. `disabled_at` blocks login |

### emergency_contacts (Personnel)
| Column | Type | Notes |
|---|---|---|
| user_id | foreign key | cascade on delete |
| name, relationship, phone | string | |

### volunteer_status_logs (Personnel)
| Column | Type | Notes |
|---|---|---|
| user_id | foreign key | restrict on delete |
| old_status, new_status | string(16) | |
| reason | string | required |
| changed_by | foreign key | optional, set to null if that user is deleted |

### audit_logs (Records)
| Column | Type | Notes |
|---|---|---|
| actor_id | foreign key | optional, null for system work |
| action | string(64) | for example `assignment.created` |
| entity, entity_id | string, bigint | what the action touched |
| meta | json | optional detail, before and after for changes |
| ip_address | string(45) | optional |
| created_at | timestamp | rows are never updated or deleted |

### consent_records (Records)
| Column | Type | Notes |
|---|---|---|
| user_id | foreign key | restrict on delete |
| purpose | string(32) | privacy_notice or location_tracking |
| notice_version | string(32) | version of the notice agreed to |
| consented_at, withdrawn_at | timestamp | withdrawn_at is empty while consent is active |
| ip_address | string(45) | optional |
