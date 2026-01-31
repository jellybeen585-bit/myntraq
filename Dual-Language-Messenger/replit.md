# Myntraq Messenger Application

## Overview

Myntraq is a production-ready real-time messenger application built with a React frontend and Node.js/Express backend. The application provides secure messaging features including user authentication via Replit Auth, private 1:1 chats, user profiles with unique tags, and multi-language support (English and Russian). The design follows a VS Code-inspired dark theme with monospace typography.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state, Zustand for client state (language preferences)
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode support)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` (landing, home, not-found)
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/` for authentication, language, and mobile detection
- Internationalization via custom i18n system supporting English and Russian

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **HTTP Server**: Node.js HTTP server (allows future WebSocket integration)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Replit Auth integration using OpenID Connect

The backend is organized as:
- `server/index.ts` - Main entry point, middleware setup
- `server/routes.ts` - API route definitions with Zod validation
- `server/storage.ts` - Database access layer interface
- `server/db.ts` - Drizzle database connection
- `server/seed.ts` - Demo data seeding
- `server/replit_integrations/auth/` - Replit Auth implementation

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - Contains all database table definitions
- **Key Tables**:
  - `users` and `sessions` - Replit Auth mandatory tables
  - `user_profiles` - Extended user data with unique tags
  - `chats` - Private and group chat containers
  - `chat_participants` - Chat membership tracking
  - `messages` - Message content with sender references
  - `friendships` - Friend request and connection tracking

### Authentication
- Uses Replit Auth via OpenID Connect
- Session-based authentication with PostgreSQL-backed session store
- JWT tokens handled through Replit's OIDC flow
- Protected routes use `isAuthenticated` middleware

### API Design
- RESTful API endpoints under `/api/` prefix
- Request validation using Zod schemas
- Endpoints for:
  - User profile management (`/api/profile`)
  - Chat operations (`/api/chats`)
  - Message handling (`/api/chats/:chatId/messages`)
  - User search (`/api/users/search`)
  - Friendship management (`/api/friendships`)

### Build System
- Development: Vite dev server with HMR
- Production: Custom build script using esbuild for server bundling and Vite for client
- Output: Combined bundle in `dist/` directory

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations stored in `migrations/` directory

### Authentication Services
- **Replit Auth**: OpenID Connect provider at `https://replit.com/oidc`
- Required environment variables: `REPL_ID`, `SESSION_SECRET`, `ISSUER_URL`

### Third-Party Libraries
- **Radix UI**: Accessible component primitives for all UI elements
- **TanStack Query**: Server state synchronization
- **Zod**: Runtime type validation for API requests
- **date-fns**: Date formatting and manipulation
- **Zustand**: Lightweight state management for language preferences

### Development Tools
- **Replit Vite Plugins**: Error overlay, cartographer, dev banner for Replit environment
- **TypeScript**: Full type coverage across client and server