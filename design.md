# The Neon Social Design System



## 1. Overview & Creative North Star: The Neon Social Hearth

This design system is built to transform a standard gaming utility into a premium digital sanctuary. Our Creative North Star, **"The Neon Social Hearth,"** balances the high-energy pulse of modern technology with the warm, communal invitation of a game night.



To move beyond the "template" look, we employ **Editorial Asymmetry**. This means prioritizing large, high-impact imagery (board game box art) and utilizing aggressive typography scales that break the traditional grid. By layering semi-transparent surfaces and using tonal depth instead of rigid borders, we create a UI that feels fluid, cinematic, and intentionally designed.



---



## 2. Colors: Tonal Depth & The "No-Line" Rule

Our palette is rooted in high-contrast energy, designed to pop against the deep, cinematic backgrounds of Dark Mode or the gallery-like purity of Light Mode.



### The Palette

- **Primary (Electric Indigo):** Use `primary` (#a3a6ff) for core identity and brand-level elements.

- **Secondary/Action (Hot Pink):** Use `secondary` (#ff6f7e) for high-conversion CTAs like "Join" or "Create."

- **Success/Live (Cyber Mint):** Use `tertiary` (#9bffce) exclusively for active status rings and successful matches.

- **Neutral/Surface:** Ground the experience in `surface` (#040d22) for Dark Mode and `inverse_surface` (#faf8ff) for Light Mode.

### Light Mode Surface Scale

All `surface-container-*` tokens remap automatically in light mode via CSS variable overrides:

| Token | Dark value | Light value |
|---|---|---|
| `surface` | #040d22 | #faf8ff |
| `surface-container-lowest` | #03091a | #f5f3ff |
| `surface-container-low` | #0a1428 | #f0eeff |
| `surface-container` | #0f1c36 | #e6e3ff |
| `surface-container-high` | #121f3b | #dddaff |
| `surface-container-highest` | #192848 | #d4d0ff |

**Rule:** Never use `dark:` prefixed Tailwind classes for surface colors — always rely on the CSS variable remap so all tokens (including hover states) work correctly in both modes.



### Surface Hierarchy & The "No-Line" Rule

**Explicit Instruction:** Do not use 1px solid borders to define sections.

Boundaries must be created through background shifts. For example, a card utilizing `surface_container_low` should sit on a `surface` background.



**The Glass & Gradient Rule:**

To provide a "signature" feel, use **Glassmorphism** for floating headers or navigation bars. Apply a `surface` color at 60% opacity with a 20px backdrop blur. For primary CTAs, apply a subtle linear gradient from `primary_dim` to `primary` at a 135-degree angle to create a sense of tactile "glow."



---



## 3. Typography: Editorial Authority

We use **Plus Jakarta Sans** as our primary voice, selected for its modern, geometric clarity and high-end feel.



- **Display & Headlines:** Use `display-lg` and `headline-lg` with `font-weight: 800`. These should feel massive and authoritative, often using negative letter-spacing (-0.02em) to create a tight, editorial "magazine" aesthetic.

- **Subheaders:** The "Discover" headers should use `title-lg` with generous top-padding (`spacing-8`) to allow the interface to breathe.

- **Metadata:** For player counts and locations, use `label-md` (Manrope). This shifts the font family slightly to signal a change from "storytelling" typography to "utility" information.



---



## 4. Elevation & Depth: Tonal Layering

Traditional shadows are often a crutch for poor spacing. In this system, depth is earned through the **Layering Principle.**



- **The Stack:** Layer containers using the `surface_container` tiers.

- *Base:* `surface`

- *Section:* `surface_container_low`

- *Card:* `surface_container_highest`

- **Ambient Shadows:** If a card must float (e.g., a modal), use a shadow with a blur of `32px`, an opacity of `8%`, and a color-tinted hue using `on_surface` rather than pure black.

- **The Ghost Border:** For accessibility on interactive inputs, use `outline_variant` at **15% opacity**. This creates a "suggestion" of a border that guides the eye without cluttering the UI.



---



## 5. Components



### The Friends Activity Ring

Avatars must be circular, utilizing the `full` roundedness scale. Active sessions are indicated by a 2px stroke of `tertiary` (Cyber Mint) with a subtle outer glow (0px 0px 8px `tertiary_container`).



### Smart Matcher Banner

This is a high-impact editorial section. Use a full-bleed `primary_container` background or a high-resolution board game macro-shot. Overlap a `surface_bright` card on the bottom-right corner of the banner to break the container's symmetry.



### Buttons (High-Impact)

- **Primary Action:** `secondary` (#ff6f7e) background with `on_secondary` text. Roundedness: `md`.

- **Secondary Action:** `surface_variant` background with `primary` text. No border.

- **Tertiary:** Transparent background, `primary` text, `font-weight: 700`.



### Cards & Lists

**Forbid the Divider:** Never use horizontal lines to separate list items. Use `spacing-3` (vertical whitespace) or alternating background shades (`surface_container_low` vs `surface_container_lowest`) to distinguish items. Board game box art should always use the `xl` (1.5rem) corner radius to feel premium and "object-like."

### Dropdown / Menu Items

All interactive menu rows must use `mx-2 rounded-[0.75rem]` on the element itself so the hover background is inset and rounded — never full-bleed. Apply `hover:bg-surface-container-highest` for neutral items and `hover:bg-error-container/20` for destructive items. Remove `w-full` from any block-level flex element that also has `mx-2` to avoid margin overflow.



---



## 6. Do’s and Don’ts



### Do:

- **Use Asymmetric Padding:** Allow headers to have more space on the top than the bottom to create a "rhythmic" scroll experience.

- **Leverage Tonal Depth:** Move from dark to light surfaces to guide the user's eye toward the "center of the hearth."

- **Prioritize Art:** Treat board game box art as the "hero" of every card. The UI should exist only to frame the art.



### Don’t:

- **Don't use 100% Opaque Borders:** This shatters the "Neon Social" vibe and makes the app look like a generic framework.

- **Don't use pure Black Shadows:** Shadows should always be tinted with the `on_surface` color to maintain the "Cinematic Slate" atmosphere.

- **Don't crowd the metadata:** If information isn't vital to the "Join" decision, hide it or use the `body-sm` scale at 60% opacity.



---



## 7. Scale Specifications



| Token | Value | Intent |

| :--- | :--- | :--- |

| **Spacing-4** | 1.4rem | Standard gutter for mobile edge-padding. |

| **Radius-xl** | 1.5rem | Signature radius for game cards and main banners. |

| **Radius-md** | 0.75rem | Standard radius for buttons and chips. |

| **Surface-Container-High** | #121f3b | The "standard" card background for Dark Mode. |