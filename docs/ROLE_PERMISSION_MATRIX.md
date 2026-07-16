# Role and permission matrix

UI visibility is not authorization. Server actions and Supabase RLS enforce the permissions below.

| Capability                                                                                       | Super admin                                                                 | Manager                       | Officer             | Viewer / auditor |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------- | ------------------- | ---------------- |
| View cases, workflow history, reports, and audit timeline                                        | Yes                                                                         | Yes                           | Yes                 | Yes              |
| Create a case                                                                                    | Yes                                                                         | Yes                           | Yes, owned by self  | No               |
| Edit or transition any non-final case                                                            | Yes                                                                         | Yes                           | No                  | No               |
| Edit or transition a case owned by or currently assigned to self                                 | Yes                                                                         | Yes                           | Yes                 | No               |
| Edit completed/cancelled case data                                                               | Manager override only through supported workflow rules; no history mutation | Supported workflow rules only | No                  | No               |
| Upload versioned documents to an editable case                                                   | Yes                                                                         | Yes                           | Owned/assigned case | No               |
| Download documents for a visible case                                                            | Yes                                                                         | Yes                           | Yes                 | Yes              |
| Add comments                                                                                     | Yes                                                                         | Yes                           | Yes                 | No               |
| Manage master data and workflow templates                                                        | Yes                                                                         | No                            | No                  | No               |
| View personnel KPI and grouped work-status reports                                               | Yes                                                                         | Yes                           | Yes                 | Yes              |
| Change roles or protected profile fields                                                         | Yes                                                                         | No                            | No                  | No               |
| Mutate audit events, completed stage history, responsibility history, or prior document versions | No direct mutation                                                          | No                            | No                  | No               |
| Read/update notifications                                                                        | Own only                                                                    | Own only                      | Own only            | Own only         |

Cases and referenced master data are archived/finalized rather than hard-deleted. The application currently has no user-provisioning screen; initial Auth users and the first `super_admin` assignment are controlled operational steps documented in `DEPLOYMENT.md`.
