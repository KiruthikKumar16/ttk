# Role permissions

> Generated from `lib/auth/permissions.ts` by `pnpm docs:permissions`. Do not edit this table by hand.

| Resource     | Admin                                                      | Staff                        | Trainer                      |
| ------------ | ---------------------------------------------------------- | ---------------------------- | ---------------------------- |
| students     | read, create, update, delete, issue, grade, export, manage | read, create, update         | read                         |
| payments     | read, create, update, delete, issue, grade, export, manage | read, create                 | —                            |
| courses      | read, create, update, delete, issue, grade, export, manage | read, create                 | read                         |
| certificates | read, create, update, delete, issue, grade, export, manage | read, create, issue          | read                         |
| attendance   | read, create, update, delete, issue, grade, export, manage | read, create, update         | read, create, update         |
| assessments  | read, create, update, delete, issue, grade, export, manage | read, create, update, grade  | read, create, update, grade  |
| materials    | read, create, update, delete, issue, grade, export, manage | read, create, update, delete | read, create, update, delete |
| audit        | read, create, update, delete, issue, grade, export, manage | —                            | —                            |
| reports      | read, create, update, delete, issue, grade, export, manage | read, export                 | read                         |
| gst          | read, create, update, delete, issue, grade, export, manage | read                         | —                            |
| users        | read, create, update, delete, issue, grade, export, manage | —                            | —                            |
| verification | read, create, update, delete, issue, grade, export, manage | —                            | —                            |
