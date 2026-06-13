# Remove ALL rounded corners from all print templates — make everything square

Files to fix:
- C:\auto_billmensor\src\components\print\ProfessionalTemplate.tsx
- C:\auto_billmensor\src\components\print\CompactTemplate.tsx
- C:\auto_billmensor\src\components\print\ModernTemplate.tsx
- C:\auto_billmensor\src\components\print\ThermalTemplate.tsx (no rounded — skip)

Replace ALL `rounded-*` classes with square corners (no border-radius). Use `rounded-none` or simply remove the rounded class.

## ProfessionalTemplate.tsx

1. Line 82: `rounded-full` → `rounded-none` (payment status badge)
2. Line 193: `rounded-xl` → `rounded-none` (tax analysis box)
3. Line 236: `rounded-xl` → `rounded-none` (bank details box)
4. Line 296: `rounded-lg` → `rounded-none` (discount row)

## CompactTemplate.tsx

1. Line 75: `rounded-full` → `rounded-none` (payment status badge)
2. Line 136: `rounded` → `rounded-none` (no-image placeholder)
3. Line 267: `rounded` → `rounded-none` (discount row)

## ModernTemplate.tsx

1. Line 29: `rounded-4xl` → `rounded-none` (outer Card wrapper)
2. Line 47: `rounded-2xl` → `rounded-none` (logo fallback icon box)
3. Line 65: `rounded-full` → `rounded-none` (payment status badge)
4. Line 69: `rounded-full` → `rounded-none` (status dot — keep as `w-2 h-2` square or just remove rounded-full)
5. Line 90: `rounded-3xl` → `rounded-none` (vendor+client info box)
6. Line 213: `rounded-3xl` → `rounded-none` (tax analysis box)
7. Line 246: `rounded-3xl` → `rounded-none` (bank details box)

## ThermalTemplate.tsx
No rounded classes — skip this file.

## After fixing
Run `npx tsc --noEmit` from C:\auto_billmensor and ensure zero errors.
Do NOT run git push.
