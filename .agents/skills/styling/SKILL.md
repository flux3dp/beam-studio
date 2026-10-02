---
name: styling
description: SCSS-module and antd styling conventions for Beam Studio — spacing scale (multiples of 4 or 10), shared variables/mixins, icon sizing gotchas, fit-to-container media boxes. Use when writing or reviewing any *.module.scss, inline style, or antd theme token.
---

# Styling Skill

Conventions for component styling in `packages/core`. Primary mechanism is Ant Design theming
(`ConfigProvider` / theme tokens); SCSS modules (`Component.module.scss`) are for what tokens
cannot express. Read this before touching a `.module.scss`.

## Spacing scale

Every spacing value — `padding`, `margin`, `gap`, `width`/`height` of layout boxes, `top`/`left`
offsets — is a **multiple of 4 or of 10**. Allowed: 2, 4, 8, 10, 12, 16, 20, 24, 30, 32, 40, 56,
60, 260 … Not allowed: 5, 6, 9, 14, 18, 264. No half pixels anywhere.

- A mockup value that is off-scale (e.g. `264px`, `padding: 6px 4px 14px`) is rounded to the
  nearest scale value (`260px`, `8px 4px 12px`); the mockup is not a spec for pixels.
- `font-size` is **exempt** from the scale (12, 13, 14 are all fine) but must still be a whole
  pixel — no `12.5px`.
- Stroke widths (`border: 1.5px`, `stroke-width`) are exempt; they are drawing, not spacing.
- Shared layout constants live in `packages/core/src/web/styles/_variables.scss`
  (`$sidePanelWidth`, `$topBarHeight`, `$panelBorderColor`, …) — use them instead of repeating
  the number. Mixins in `_mixins.scss` (`footer`, `viewport-size`); page-local mixins next to
  the page (e.g. `components/welcome/_mixins.scss`: `title`, `subtitle`, `content`).

## Icons sized with `1em`

SVG icons imported as React components (`@svgr/webpack`) render at `width="1em" height="1em"`,
so their size is whatever `font-size` the **nearest** ancestor sets. Two consequences:

- Any wrapper between the sizing element and the icon can shrink it. antd `Badge`, for example,
  sets `font-size: 14px` and `color` on its root span; the existing
  `LeftPanel/components/LeftPanelButton.module.scss` cancels that with
  `.badge { color: inherit; font-size: inherit }`. When you nest another `Badge`, pass
  `styles={{ root: { color: 'inherit', fontSize: 'inherit' } }}` — the `style` prop goes to the
  count bubble, not the root.
- Icons whose glyph does not fill its viewBox look smaller than their neighbours at the same
  `font-size`. Compensate per usage with a `transform: scale(…)` class, like `.beamy-icon` /
  `.dmkt-icon` / `.book-icon` in `pages/Welcome.module.scss`; do not redraw the shared SVG for one
  call site.

## Media boxes that must fit their container

A `width: 100%; aspect-ratio: 16 / 9` box is width-driven: when the column is too short it
overflows instead of shrinking, and `max-height` does not transfer back into the width. For a
player/preview that has to fit whatever height is left, make the slot a size container and let
the child pick the smaller of the two limits:

```scss
.slot {
  container-type: size;
  display: flex;
  flex: 1;
  justify-content: center;
  min-height: 0;
  > div {
    width: min(100%, calc(100cqh * 16 / 9));
    aspect-ratio: 16 / 9;
  }
}
```

Reference: `components/dialogs/Flux101/CourseBody.module.scss`.

## Layering

antd modals and drawers sit at `z-index: 1000` in DOM order. Do not give a fixed element a
higher z-index to float above "the current dialog" — every dialog opened afterwards will render
under it. Put the element inside the dialog's own DOM instead.

## Checklist

- [ ] Every spacing value is a multiple of 4 or 10; font sizes are whole pixels.
- [ ] Repeated constants come from `_variables.scss`.
- [ ] Icons placed inside a third-party wrapper keep their `font-size`.
- [ ] Nothing fixed-positioned relies on out-z-indexing antd modals.
