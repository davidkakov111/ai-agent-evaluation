# Authorization Policy Matrix

TaskFlow uses role-based access control with strict tenant scoping.

## Core rules

- Every authenticated user can belong to at most one organization.
- Organization-scoped resources (tasks, join requests) must always be resolved by both `id` and `organizationId`.
- API entry checks use reusable policy guards from `src/server/auth/policies.ts`.
- Service layer enforces the same checks to prevent bypass through internal calls.

## Role permissions

| Action | OWNER | ADMIN | EMPLOYEE |
| --- | --- | --- | --- |
| Create organization | Yes (for own account, if not already in org) | Yes (same as user capability) | Yes (same as user capability) |
| Approve/reject join requests | Yes | Yes | No |
| Create tasks | Yes | Yes | No |
| Assign tasks to employees | Yes | Yes | No |
| View all tasks in organization | Yes | Yes | No |
| View assigned tasks | Yes | Yes | Yes |
| Update task status (any org task) | Yes | Yes | No |
| Update task status (own assigned task) | Yes | Yes | Yes |
| Leave organization | No | No | No |

## Prohibited operations

- Cross-organization reads/writes using global IDs only.
- Employee approval/rejection of join requests.
- Employee task assignment.
- Employee status updates on tasks assigned to other users.
- Re-joining or joining another organization once membership exists.

## Guard reference

- `requireAuth(session)`
- `requireOrgMember(db, { userId, organizationId })`
- `requireRole(currentRole, allowedRoles)`
- `requireTaskAssigneeOrManager({ actorUserId, actorRole, assignedToId })`
- `requireScopedTask(db, { taskId, organizationId })`
- `requireScopedJoinRequest(db, { joinRequestId, organizationId })`
