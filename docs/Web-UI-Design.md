# Bilingual web UI: review and implementation plan

The product is a browser-based time tracker for people recording work, reviewing entries and managing reports. Its central job is to start or correct a time entry with little friction. Apple's foundations inform readability, hierarchy, feedback and responsive layout; native Mac menu-bar or iPhone tab-bar requirements do not apply to this website.

## Review of the starting implementation

- High: the dense sidebar has no selected-page feedback, and page titles mix hierarchical paths with content names. Group work, reports and account settings; expose the current page with `aria-current`.
- High: the fixed login footer and fixed-width content can overlap at small sizes or high browser zoom. Use flowing layouts and a bounded readable content region.
- High: the tracker gives its main start action a low-emphasis text button while adjacent controls compete. Use a labelled primary action with a stable timer area.
- Medium: almost all visible strings are hard-coded in English. Add a language setting with a browser-language default before login and a server-side per-user preference afterwards; keep date formatting independent.
- Medium: some icon-only actions have only tooltips or no accessible name. Name controls, add visible keyboard focus and keep adequate hit regions.

## Tokens and layout

The design is intentionally a quiet work tool: the running time in tabular figures is its signature. No decorative KPI hero, glass cards or extra dashboard metrics are introduced. The layout is specific to the recording/review workflow rather than a generic landing-page template.

System sans-serif for navigation and body, minimum 15px body text with a 1.5 line height; 22–28px headings; tabular figures for duration. Six core color roles: canvas, surface, content, secondary content, action, destructive action. Contrast values below are computed against each surface with WCAG relative luminance.

| Mode | Canvas / surface | Content | Secondary | Action | Destructive |
|---|---|---|---|---|---|
| Light | #f5f5f7 / #ffffff | #1d1d1f (16.83:1) | #51545a (7.59:1) | #0064d9 (5.49:1) | #b42318 (6.57:1) |
| Dark | #101114 / #1c1e22 | #f5f5f7 (15.33:1) | #b1b5be (8.12:1) | #8bbcff (8.53:1) | #ff9c94 (8.29:1) |

Regular layout:

```text
[Traggo            ] | Current page                    Language  Account
[Record / Calendar ] | [Tags / description             Start timer]
[Reports           ] | Running timers · elapsed time · Stop
[Tags / Devices    ] | Entries grouped by day
[Settings          ] | 
```

Compact layout:

```text
[Menu] Current page                 Language
[Tags / description                        ]
[Start timer] [More]
[Running timer / elapsed / Stop            ]
[Entries flow vertically                  ]
```

Use a responsive drawer, not a fixed-width mobile page. Core actions remain available at all widths. Respect reduced motion, increased contrast and browser zoom. Keep content surfaces opaque: blur does not improve recording or reviewing work. Retain the four existing theme identifiers for API compatibility and existing user preferences.

## Reference basis

- `accessibility.md › Vision`: “Support larger text sizes.” Use browser zoom-safe dimensions and a 200% text check. [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- `layout.md › Visual hierarchy`: “Order content by relative importance.” Timer input precedes historic entries. [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/layout)
- `typography.md › Ensuring legibility`: “In general, avoid light font weights.” System regular/medium/semibold form the type scale. [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/typography)
- `color.md › Best practices`: “Avoid using the same color to mean different things.” Blue denotes action/selection; destructive actions retain a separate red role. [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/color)
- `buttons.md › Best practices`: “Make buttons easy for people to use.” Use 44px minimum primary/touch targets. [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/buttons)
- `writing.md › Getting started`: “Be clear.” Use consistent German/English action names rather than internal API terminology. [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/writing)

This document describes code-level findings and a proposal, not observed live screenshots. Native platform conventions are deliberately not imposed. Final validation must distinguish automated tests/API acceptance from browser layout, focus, accessibility and live-container deployment.

## Implemented behavior

German and English are available before and after login. An unset account preference uses the browser language (German for `de*`, otherwise English); a browser selection survives reloads. Signed-in changes persist only the authenticated user's language. Existing date formatting, week start and four theme identifiers remain separate. Existing clients can continue sending the unchanged `InputUserSettings` mutation without clearing the language.

The database migration adds the nullable `interface_language` column to `user_settings`. Existing rows remain unset and follow the browser preference until selected. Time entries, tags, devices, dashboards and favorites do not need conversion. Use a database copy for upgrades and retain a backup for rollback.

Navigation marks the current page, puts time recording first and collapses to a drawer on narrow screens. Login uses normal document flow and password-manager autocomplete; its submit action no longer fires twice. The timer action has primary emphasis, pending state and visible network errors. All four existing appearance options use the new typography, spacing and semantic colors. Calendar titles are HTML-escaped before insertion, including quoted attributes.

Application labels and common dialogs use the translation catalog; user-entered names, tags, notes and relative-range expressions remain unchanged. Unexpected server diagnostics may retain their original technical wording. No new runtime translation dependency is added.

## Validation commands

- `go test -race ./...` and `go vet ./...`.
- Build UI, then `go build -o /tmp/traggo-language-test .` and `python3 tests/interface_language.py --binary /tmp/traggo-language-test`.
- In `ui/`: TypeScript, ESLint, Prettier, Vitest and Vite production build. Tests cover translation completeness, live language changes, date-format independence, four-theme contrast and calendar title escaping.
- Optional isolated browser suite: install Playwright outside the shipped UI dependencies, set `TRAGGO_TEST_BINARY` to the built server, optionally `CHROME_EXECUTABLE` and `PLAYWRIGHT_MODULE`, then run `node tests/web_ui.cjs`. It starts a separate local server with generated empty data; no production address or token is accepted. Screenshots are stored in its printed temporary directory.

Browser checks exercise German login, timer creation/stop, persisted English after reload, a saved appearance change, German/English settings, 200% text, 390px navigation/calendar and uncaught errors. The old duration formatter unconditionally removed the first character to hide an approximation prefix. For zero-length durations it removed the zero instead; only the actual prefix is removed now, with regression tests for zero and multi-digit durations.

## Visible redesign after user feedback

The first pass changed foundations while retaining the original composition; the user's observation that it mainly looks translated is justified. Rating: needs work (High: unchanged recording hierarchy and visually fragmented history). This is a browser time tracker, so Apple's layout, readability and feedback principles apply; native macOS menu conventions do not.

Keep the tested six-role colors and four compatible appearance settings (including measured contrast). Use system type at 15px body, 32px page title, 20px section title and 36px tabular running duration. The signature is the working timer itself, not invented productivity metrics. Put the recording mode beside the new-entry heading, the primary start action alongside the tags, running entries in a distinct live section and completed entries in a shared, dated log surface. Sidebar groups become spaced navigation with rounded selected rows rather than full-width ruled blocks. No decorative charts, gradients or extra status badges.

Regular: `[sidebar] [date / Time tracking] → [New entry: Timer | Manual] → [Running: elapsed / tags / Stop] → [History: date / editable rows]`.
Compact: same order, stacked entry controls; running elapsed figure stays above its editable fields. Empty history explains the next action. Existing editing, notes, tags, calendar and favorites remain available.

Basis: `layout.md › Visual hierarchy`: “Group related items to clearly express related information or functions.” `feedback.md › Best practices`: “Consider integrating status feedback into your interface.” `buttons.md › Style`: “use a button that has a prominent visual style for the most likely action”. `typography.md › Conveying hierarchy`: “Adjust font weight, size, and color as needed to emphasize important information”. The specific log composition and quieter sidebar are design judgments for this time tracker. Critique: a decorative hero or daily KPI row would obscure recording and can be removed; the elapsed timer provides the necessary visual identity.
