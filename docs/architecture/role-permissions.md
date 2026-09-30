# Role permissions

> Generated from `lib/auth/permissions.ts` by `pnpm docs:permissions`. Do not edit this table by hand.

| Resource     | Admin                                                      | Staff                        | Pending |
| ------------ | ---------------------------------------------------------- | ---------------------------- | ------- |
| students     | read, create, update, delete, issue, grade, export, manage | read, create, update         | —       |
| payments     | read, create, update, delete, issue, grade, export, manage | —                            | —       |
| courses      | read, create, update, delete, issue, grade, export, manage | —                            | —       |
| certificates | read, create, update, delete, issue, grade, export, manage | —                            | —       |
| attendance   | read, create, update, delete, issue, grade, export, manage | read, create, update         | —       |
| assessments  | read, create, update, delete, issue, grade, export, manage | read, create, update, grade  | —       |
| materials    | read, create, update, delete, issue, grade, export, manage | read, create, update, delete | —       |
| audit        | read, create, update, delete, issue, grade, export, manage | —                            | —       |
| reports      | read, create, update, delete, issue, grade, export, manage | read, export                 | —       |
| gst          | read, create, update, delete, issue, grade, export, manage | —                            | —       |
| users        | read, create, update, delete, issue, grade, export, manage | —                            | —       |
| verification | read, create, update, delete, issue, grade, export, manage | —                            | —       |
