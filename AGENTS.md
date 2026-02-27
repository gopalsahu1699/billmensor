# AGENTS.md - BillMensor Development Guide

This document provides guidelines for AI agents working on the BillMensor codebase.

## Project Overview

BillMensor is a Next.js 16 invoicing and billing application with TypeScript, Tailwind CSS v4, Supabase (authentication and database), and Razorpay (payments).

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint on all files
```

### Desktop App (Tauri)
```bash
npm run tauri        # Open Tauri CLI
npm run tauri:dev   # Run desktop app in dev mode
npm run tauri:build # Build desktop app (.exe)
```

### Running Tests
This project does not currently have a test framework. Add Vitest if needed:
```bash
npm install -D vitest @vitejs/plugin-react jsdom
npx vitest run src/hooks/useInvoice.test.ts
```

### Type Checking
```bash
npx tsc --noEmit     # Type-check without emitting files
```

## Code Style Guidelines

### General Principles
- Use TypeScript with strict mode enabled
- Prefer functional components with hooks over class components
- Keep components small and focused (single responsibility)
- Use early returns to reduce nesting

### TypeScript
- Always define explicit return types for functions when non-obvious
- Use `type` for unions, interfaces for object shapes
- Prefer `interface` over `type` for component props
- Use `unknown` instead of `any`, or narrow with type guards

```typescript
interface InvoiceProps {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}

export function InvoiceCard({ id, amount, status }: InvoiceProps) {
  if (!id) return null;
  // ...
}
```

### Imports
- Use absolute imports with `@/` prefix (mapped to `./src/`)
- Order imports: external libs -> internal modules -> relative imports
- Use `import { type Foo }` syntax when only using types

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/types/index';
import { invoiceService } from '@/services/invoice.service';
import { cn } from '@/lib/utils';
```

### Naming Conventions
- **Files**: kebab-case for pages/routes (`page.tsx`, `create-invoice-page.tsx`), PascalCase for components (`InvoiceCard.tsx`), camelCase for utilities/hooks (`useInvoice.ts`)
- **Components**: PascalCase (`InvoiceList`, `PaymentForm`)
- **Hooks**: camelCase starting with `use` (`useInvoice`, `useInvoices`)
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE for config values, PascalCase for component-related constants

### React/Next.js Patterns

#### Server vs Client Components
- Default to Server Components (no 'use client' directive)
- Add 'use client' only when using: useState, useEffect, useRef, event handlers, browser APIs, custom hooks using these
- Mark client boundaries at the leaf components when possible

#### Error Handling
- Use try/catch with async/await, set error state in catch blocks
- Provide user-friendly error messages

```typescript
try {
  setLoading(true);
  const data = await invoiceService.getById(id);
  setInvoice(data);
} catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("An unknown error occurred");
  }
} finally {
  setLoading(false);
}
```

#### Loading States
- Use boolean `loading` state, not 'idle'/'loading' enums
- Show skeletons (from `@/components/ui/skeleton`) while loading

### Tailwind CSS v4
- Use utility classes for styling
- Use `cn()` utility for conditional classes (merges tailwind classes properly)
- Prefer semantic colors from design system if available

```typescript
import { cn } from '@/lib/utils';

<Button className={cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-primary text-white"
)} />
```

### Form Validation
- Use Zod for schema validation
- Define validators in `@/lib/validators.ts`

```typescript
import { z } from 'zod';

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(itemSchema).min(1, "At least one item required"),
  amount: z.number().positive(),
});
```

### Database/Supabase
- Use service layer pattern (`@/services/*.service.ts`)
- Keep database queries in service files, not components
- Use proper TypeScript types from `@/types/index`

### API Routes
- Place in `src/app/api/*/route.ts`
- Use Next.js App Router conventions
- Return proper Response objects

### Component Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Authenticated pages
│   └── api/                # API routes
├── components/
│   ├── ui/                 # Reusable UI components (Button, Input, etc.)
│   ├── layout/             # Layout components (Navbar, Sidebar)
│   └── print/              # Print templates
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, validators, constants
├── services/               # API/Database service layer
└── types/                  # TypeScript type definitions
```

### File Organization
- One primary export per file
- Co-locate related files (components with their types if small)
- Use index files for clean public exports (`@/types/index.ts`)

### Linting
- ESLint is configured with `eslint-config-next/typescript`
- Run `npm run lint` before committing
- Fix warnings as they appear

### Git Conventions
- Use clear, descriptive commit messages
- Branch naming: `feature/description`, `fix/description`, `hotfix/description`
- Run `npm run lint` and `npm run build` before pushing

### What to Avoid
- Don't use `any` - use `unknown` or proper types
- Don't disable TypeScript strict mode checks without good reason
- Don't fetch data in client components if it can be done server-side
- Don't use console.log for debugging in production (use console.error for errors)
- Don't mix concerns in components (keep UI, business logic, and data fetching separate)
