# Theming

The frontend supports multiple visual themes selected at the top right and persisted to
`localStorage`. To add a theme:

1. Add an entry to the `THEMES` array in `frontend/src/theme/theme.tsx`
   (`{ id, label, description }`).
2. Add a matching `[data-theme='<id>']` block in `frontend/src/index.css`.

No component changes are needed; `ThemeSelector.tsx` renders every registered theme
automatically.

## Dark vs light themes

- **Dark themes** only need to swap the `body` background. Components already use white
  glass surfaces and white text, so those stay legible.
- **Light themes** must override the exact Tailwind utility classes the components use.
  Tailwind arbitrary-opacity classes (for example `bg-white/[0.08]`) bake literal colours
  into the CSS and cannot be flipped through variables, so a light theme retargets each
  class with a theme-scoped selector such as
  `[data-theme='cupertino'] .bg-white\/\[0\.08\]`.

## Constraint

Keep the data, map, add-location flow, refresh behaviour, and the backend API unchanged
when adding a theme. A theme is purely a visual layer.
