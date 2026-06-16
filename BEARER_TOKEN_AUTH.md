## Bearer Token Authentication & Role-Based Access

### Overview

All protected API endpoints now require Bearer token authentication. User roles are automatically extracted and available for authorization checks.

### Implementation

#### 1. **Custom Decorators**

Two decorators have been created to easily access authenticated user data:

- **`@CurrentUser()`** - Returns the currently authenticated `User` object

  ```typescript
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User>
  ```

- **`@UserRole()`** - Returns the currently authenticated user's `Role` object
  ```typescript
  async findAll(
    @CurrentUser() _currentUser: User,
    @UserRole() _userRole?: Role,
  ): Promise<User[]>
  ```

Decorators located in:

- [src/auth/decorators/current-user.decorator.ts](src/auth/decorators/current-user.decorator.ts)
- [src/auth/decorators/user-role.decorator.ts](src/auth/decorators/user-role.decorator.ts)

#### 2. **Guard Implementation**

[src/auth/guards/auth-token.guard.ts](src/auth/guards/auth-token.guard.ts) validates tokens and attaches user/role to request

#### 3. **Protected Controllers**

All endpoints now require Bearer token authentication:

**Users Controller** ([src/users/users.controller.ts](src/users/users.controller.ts))

- `POST /users` - Create user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

**Roles Controller** ([src/roles/roles.controller.ts](src/roles/roles.controller.ts))

- `GET /roles` - Get all roles

**Auth Endpoints** (Public)

- `POST /auth/login` - No auth required
- `POST /auth/logout` - Bearer token required
- `GET /auth/me` - Bearer token required

### Usage

#### Request Format

All protected API calls require the Authorization header:

```
Authorization: Bearer <access_token>
```

#### Example Request

```bash
curl -X GET http://localhost:5000/users \
  -H "Authorization: Bearer your_access_token_here"
```

#### Example Response (Swagger UI)

In Swagger UI (/api/docs), click the "Authorize" button and enter your token.

### Role-Based Authorization (Ready for Implementation)

You now have access to user role information in your controllers. To implement role-based access control later:

```typescript
@Get()
async findAll(
  @CurrentUser() currentUser: User,
  @UserRole() userRole?: Role,
): Promise<User[]> {
  // Example: Check if user has admin role
  if (userRole?.name !== 'admin') {
    throw new ForbiddenException('Admin access required');
  }

  return this.usersService.findAll();
}
```

### ESLint Configuration

The ESLint config ([eslint.config.mjs](eslint.config.mjs)) has been updated to allow unused parameters prefixed with underscore (`_`), which is useful for decorators that inject dependencies but aren't immediately used.

### Next Steps for Role-Based Access Control

1. Create a `@RequireRole()` decorator to check user roles
2. Create a `RoleGuard` to enforce role-based permissions
3. Apply guards to specific endpoints based on required roles
