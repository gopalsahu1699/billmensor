# BillMensor — Fix Sidebar Reports & Settings Visibility

## Problem
Reports and Settings sidebar items are not visible/accessible enough. Reports is buried below multiple dropdowns, Settings is at the very bottom.

## What to change

### File: src/components/layout/sidebar.tsx

1. **Import MdStar** from "react-icons/md" (add to existing md import line 8)

2. **Move Reports link UP** — currently at line 254, below all dropdowns. Move it RIGHT AFTER Customers (after line 167's closing `/>`). Add `badge="PRO"` prop and render the badge with amber/gold styling.

3. **Add visual separator** — after Reports link, add a `mt-4 pt-4 border-t border-white/5` div before the dropdowns section to visually separate.

4. **Move Settings dropdown up** — currently at line 265, at the very bottom. Move it RIGHT AFTER the Smart Tools dropdown (after line 252), before the theme/language toggles.

5. **Remove the old Reports link** from line 254 and **remove the old Settings block** from line 265.

6. **Update the Settings manual toggle** — the `setIsCollapsed` is currently not passed to Settings dropdown. Add it: the Settings `Dropdown` component already accepts `setIsCollapsed` prop, just pass it from parent.

### Desired nav order:
```
- Dashboard                        (line ~151)
- Customers                       (line ~159)
- Reports (PRO badge, line ~254)  ← MOVED HERE
- --- separator ---
- Inventory (dropdown)
- Sales (dropdown)
- Purchase (dropdown)
- Finance (dropdown, owner/admin)
- Smart Tools (dropdown)
- Settings (dropdown, owner/admin) ← MOVED HERE
- Language + Theme toggles
- Collapse + Logout
```

### PRO Badge rendering:
In the SidebarLink component, when badge="PRO", render a small amber pill:
```tsx
{badge === "PRO" && <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-black">PRO</span>}
```

### Do NOT:
- Run git push or any git remote commands
- Change any functionality — purely visual/nav reorganization
- Change any other files
- Modify the `t` function call for Reports label (keep `t("Reports")`)

### After changes:
- Run npx tsc --noEmit to verify no type errors
- Run git diff --stat to confirm only sidebar.tsx changed
