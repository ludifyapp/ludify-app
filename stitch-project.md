# Ludify — Google Stitch Project Specification

Use this file as your reference when setting up the Ludify project in Google Stitch.
Each section below is a self-contained prompt you paste into Stitch for that screen or component.

---

## PROJECT SETUP PROMPT

```
Create a new project called "Ludify".

Ludify is a mobile-first social platform for board game enthusiasts to discover players, organize game nights, and trade board games. The app is a PWA (Progressive Web App) built with Next.js and Tailwind CSS v4.

Design philosophy: "The Neon Social Hearth" — cinematic dark-mode-first UI that balances the high-energy pulse of neon tech with the warm communal invitation of a game night. Think editorial magazine meets neon gaming lounge.
```

---

## 1. DESIGN SYSTEM

```
Design system name: The Neon Social Hearth

COLORS
Primary (Electric Indigo): #a3a6ff  — used for brand elements, selected states, logo text
Secondary (Hot Pink): #ff6f7e       — used for all high-conversion CTAs (Join, Create, Buy)
Tertiary (Cyber Mint): #9bffce      — used for active/live status rings and online indicators

Dark Mode Surfaces (primary UI):
  surface:                    #040d22  (base background)
  surface-container-low:      #0a1428
  surface-container:          #0f1c36
  surface-container-high:     #121f3b  (standard card background)
  surface-container-highest:  #192848

Light Mode Surfaces (auto-remap):
  surface:                    #faf8ff
  surface-container-lowest:   #f5f3ff
  surface-container-low:      #f0eeff
  surface-container:          #e6e3ff
  surface-container-high:     #dddaff
  surface-container-highest:  #d4d0ff

Text:
  on-surface:         #e8e6ff  (primary text, dark mode)
  on-surface-variant: #9a99c2  (secondary/muted text)
  error:              #ff6f6f

TYPOGRAPHY
Primary font: Plus Jakarta Sans — weights 400/500/600/700/800
Utility font: Manrope — weights 400/500/600/700 (used for metadata: counts, locations, labels)

Scale:
  Display / Hero headings: Plus Jakarta Sans 800, letter-spacing -0.02em
  Section headers: Plus Jakarta Sans 700
  Body: Plus Jakarta Sans 400-500
  Metadata chips: Manrope 500-600

SPACING & RADIUS
  Standard edge padding: 1.4rem (mobile)
  Card/banner corner radius: 1.5rem (xl) — gives a premium, object-like feel
  Button/chip corner radius: 0.75rem (md)
  Spacing between list items: 0.75rem (no dividers — use spacing only)

RULES
  No-Line Rule: Never use 1px solid borders. Boundaries are created through background color shifts between surface tiers.
  Glassmorphism: Fixed headers/navbars use surface at 60% opacity + 20px backdrop blur.
  Shadows: Never pure black. Use on-surface color tinted, blur 32px, 8% opacity.
  Buttons: Primary CTA uses secondary (#ff6f7e) background. Secondary uses surface-variant with primary text. Tertiary is transparent with primary text, font-weight 700.
  Board game art is always the hero of every card — UI exists only to frame it. Always use radius-xl (1.5rem) on game art.
  Dropdown/menu items: Use mx-2 rounded-[0.75rem] inset — hover bg is rounded, never full-bleed.

LOGO
  App icon: Meeple (board game piece) shape filled with a vertical linear gradient:
    top:    #A3A6FF (Electric Indigo)
    mid:    #FF6F7E (Hot Pink)
    bottom: #9BFFCE (Cyber Mint)
  Background: #040d22 rounded square (96px radius for 512×512)
  Neon glow filter applied to the meeple shape
  
  Wordmark: "Ludify" in Plus Jakarta Sans ExtraBold, color: #a3a6ff, letter-spacing: -0.02em
```

---

## 2. NAVIGATION BAR (Header)

```
Design a fixed top navigation bar for Ludify.

Layout (left → right):
  LEFT: "Ludify" wordmark — Plus Jakarta Sans ExtraBold, color #a3a6ff, tracking -0.02em. No border, no box.
  CENTER (desktop only): Tab pills — "For You" | "Events" | "Marketplace"
    Active tab: primary color text (#a3a6ff), bold, with a 2px underline indicator in primary color
    Inactive tab: on-surface-variant (#9a99c2), medium weight, hover → secondary (#ff6f7e)
    On mobile: tabs are hidden from header (shown in bottom nav instead)
  RIGHT: 
    Bell icon (notifications) — with red badge count if pending invites
    User avatar — circular, 36px, with thin primary ring on hover
    Chevron/menu button — opens dropdown menu

Styling:
  Background: surface (#040d22) at 60% opacity with 20px backdrop blur (glassmorphism)
  No bottom border — use surface-container-low as the page background below it for separation
  Height: 64px
  Horizontal padding: 24px desktop, 16px mobile
```

---

## 3. BOTTOM NAVIGATION (Mobile)

```
Design a fixed bottom navigation bar for Ludify mobile.

Tabs (left to right):
  1. For You — house/home icon
  2. Events — calendar icon
  3. Marketplace — shopping bag icon
  4. Messages — chat bubble icon (with unread count badge in secondary color)

Styling:
  Background: surface (#040d22) at 60% opacity + 20px backdrop blur (glassmorphism)
  Active tab: icon + label in primary (#a3a6ff), filled icon style
  Inactive tab: icon + label in on-surface-variant (#9a99c2)
  No top border — use surface-container separation
  Height: 64px + safe area inset for iOS home indicator
  Label font: Manrope 500, 10px
```

---

## 4. DROPDOWN MENU

```
Design a dropdown menu for Ludify that appears when clicking the user avatar/menu button in the header.

Width: 280px, positioned top-right anchored to the button
Background: surface-container (#0f1c36)
Corner radius: 1.5rem (xl)
Shadow: large ambient shadow tinted with on-surface, 32px blur, 8% opacity
No outer border — use shadow only for separation

Sections (top to bottom):

SECTION 1 — User identity (non-interactive, padding 16px)
  User display name — Plus Jakarta Sans 600, on-surface
  User email — Manrope 400, on-surface-variant, smaller

SECTION 2 — Navigation links (each item: mx-2, rounded-[0.75rem], hover: surface-container-highest)
  Profile
  Friends  
  My Listings
  Messages (with unread count badge in secondary color if unread > 0)
  Invites (with unread count badge in red/error color if pending > 0)
  Settings

DIVIDER — Use 1px surface-container-high, subtle

SECTION 3 — Appearance submenu (chevron on right, expands inline)
  Light / Dark / System — each with a checkmark (primary color) on the active option

SECTION 4 — Language submenu (chevron on right, expands inline)
  English / Español / Português (BR) — each with a checkmark on active

DIVIDER

SECTION 5 — Destructive action
  Sign Out — error color (#ff6f7e or #ff6f6f), hover: error-container at 20% opacity

All rows: 40px height, 16px horizontal padding inside the rounded item, icon (20px) + label, Manrope 500
```

---

## 5. FOR YOU TAB

```
Design the "For You" tab for Ludify — the main social feed shown after login.

Background: surface (#040d22)
Top padding: 80px (below fixed header)

SECTION 1 — Friends Activity Carousel (horizontal scroll)
  Section label: "Friends" — Plus Jakarta Sans 700, on-surface
  Horizontal row of circular avatar bubbles, 60×60px each, scrollable
  Each bubble:
    Circular photo avatar with a colored gradient ring (2px, glow effect):
      - Ongoing event: bright green gradient ring (#9bffce)
      - Upcoming event: hot pink gradient ring (#ff6f7e → #a3a6ff)
      - Recap: amber/gold gradient ring
    Green live dot (8px) bottom-right if event is ongoing
    First name label below, Manrope 500, 11px, on-surface-variant
  Clicking a bubble opens the FriendStoryOverlay (full-screen Stories UI)
  Empty state: illustrated placeholder (two people silhouettes), muted message

SECTION 2 — Your Upcoming Events (horizontal card carousel)
  Section header row: "Your Upcoming" (Plus Jakarta Sans 700) + "See All" link (primary color, right)
  Horizontal scroll of UpcomingEventCard:
    Card size: 288px wide × ~320px tall, corner radius 1.5rem, bg: surface-container-high
    Top 60%: hero game art image (full-bleed, radius-xl top corners)
    Status chip top-right: colored pill (Waiting=amber, Full=rose, Ongoing=emerald)
    "Hosting" or "Joined" pill bottom-left of image: surface/60% blur background, Manrope 600
    Bottom 40% content (padding 12px):
      Game name: Plus Jakarta Sans 700, on-surface
      Date + time: primary color (#a3a6ff), Manrope 600
      Address: Manrope 500, on-surface-variant, truncated 1 line
      Bottom row: stacked player avatars (3 max, 24px, -6px overlap) + host name right

SECTION 3 — Hot Games (horizontal carousel)
  Section header: "Hot Games" + BGG attribution
  Game art cards in horizontal scroll, 140px wide, radius-xl

SECTION 4 — Recommended Events (horizontal card carousel)
  Section header: "Explore Events" + "See All" link
  Same UpcomingEventCard style as Section 2

SECTION 5 — Friends Are Selling (2-column grid, marketplace)
  Section header: "Friends Are Selling" + "See All" link
  2-column grid of ListingCard:
    Square-ish card, game art top (radius-xl top), price + condition badge below
    Seller avatar + name at bottom
```

---

## 6. EVENTS TAB

```
Design the "Events" tab for Ludify — for discovering and managing game night events.

Background: surface (#040d22)

SUB-TAB BAR (sticky, below header)
  Three tabs: "Explore" | "Joined" | "Mine"
  Style: text tabs with underline indicator (primary color), surface background, no border
  Font: Plus Jakarta Sans 600, 14px

EXPLORE SUB-TAB
  Search bar (full width, radius-md):
    Background: surface-container-high (#121f3b)
    Placeholder: "Search games, hosts, locations..." in on-surface-variant
    Search icon left, clear icon right when filled
    No border — ghost border (outline-variant 15% opacity) on focus only
    
  Filter pills (horizontal scroll, mt-3):
    Pills: All | Friends Hosting | Friends Joined | Today | Weekend | This Week | Spots Available
    Active pill: primary (#a3a6ff) background, surface text, radius-md
    Inactive pill: surface-container-high background, on-surface-variant text
    
  Event list (vertical, gap: 0.75rem):
    EventListCard component (see Component: EventListCard below)
    
JOINED & MINE SUB-TABS
  Filter pills: All | Next Events | Waiting | Past
  When "Waiting" selected: Sort dropdown appears (right-aligned, surface-container-high bg)
  Same EventListCard list below
  
  Empty state (centered, muted):
    Illustrated icon
    Heading: Plus Jakarta Sans 700
    Sub text: Manrope 400, on-surface-variant
    CTA button in secondary (#ff6f7e) if actionable

COMPONENT: EventListCard
  Full-width horizontal card, radius-xl, bg: surface-container-high (#121f3b)
  Layout: [Thumbnail 144px wide] [Content flex-1]
  
  Thumbnail (left):
    Game art image, full height, radius-xl on left corners, square crop
    
  Content (right, padding 12px 12px 12px 0):
    Row 1: Game name (Plus Jakarta Sans 700, on-surface) + EventStatusBadge (right-aligned)
    Row 2: Date + time (Manrope 600, on-surface-variant, 13px)
    Row 3: Address (Manrope 500, on-surface-variant, 12px, 1 line truncated)
    Row 4: Host avatar (24px circle) + host name link (primary, 12px) 
    Row 5 (bottom): Stacked friend avatars + "X friends joined" OR spots remaining pill

COMPONENT: EventStatusBadge
  Inline pill, Manrope 700, 11px, radius-full
  Waiting:   bg amber-500/15,  text amber-300
  Full:      bg rose-500/15,   text rose-300
  Ongoing:   bg emerald-500/15, text emerald-300
  Ended:     bg slate-500/15,  text slate-300
  Cancelled: bg red-500/15,    text red-300
```

---

## 7. FRIEND STORY OVERLAY

```
Design a full-screen "Stories" overlay for Ludify, similar to Instagram Stories.

This opens when a user taps a friend bubble in the For You tab.

Mobile layout (full screen, black bg):
  TOP BAR (absolute, top 0, full width, gradient overlay from black to transparent):
    Progress bars: thin (3px) horizontal bars, one per event, spacing 3px
      Filled portion: white
      Unfilled: white at 30% opacity
    Friend avatar (32px) + friend name (Plus Jakarta Sans 600, white) — row below progress bars
    Close button (×) top-right
    
  HERO IMAGE (top 56% of screen):
    Full-bleed game art or event photo
    Bottom gradient overlay (transparent → black) for readability
    
  DATE/TIME STRIP (overlapping hero/content boundary):
    Pill-shaped chip, surface at 80% blur, white text
    Manrope 600, date + time formatted
    
  CONTENT AREA (bottom 44%):
    Background: surface-container (#0f1c36)
    Event title: Plus Jakarta Sans 800, on-surface, large
    Location line: pin icon + address, Manrope 500, on-surface-variant
    Player count: people icon + "X / Y players", Manrope 500, primary
    Status badge: EventStatusBadge component
    
  "VIEW EVENT" PILL (appears on tap, auto-hides after 3.5s):
    Centered, bottom 24px, secondary (#ff6f7e) background, white text
    Plus Jakarta Sans 700, radius-full, 48px height

Desktop layout:
  Flanking neighbor cards (left/right, 60% scale, blurred, rounded)
  Center story card: 390px wide × 680px tall, radius-xl
  Same content as mobile in the center card
  Keyboard arrow navigation (← →)
  Click outside to close
```

---

## 8. MARKETPLACE TAB

```
Design the Marketplace tab for Ludify — where users buy/sell board games.

Background: surface (#040d22)

HEADER ROW:
  "Marketplace" title (Plus Jakarta Sans 800) + "Sell a Game" CTA button (secondary #ff6f7e, right)

FRIENDS ARE SELLING CAROUSEL:
  Section label + horizontal scroll of ListingCard
  
COMPONENT: ListingCard (grid variant)
  Card: ~160px wide, radius-xl, bg: surface-container-high
  Top 55%: game art, full-bleed, radius-xl top corners
  Content:
    Game title: Plus Jakarta Sans 600, on-surface, 1 line
    Price: Plus Jakarta Sans 800, primary (#a3a6ff)
    ConditionBadge: inline pill
      New:       emerald bg/text
      Like New:  primary bg/text
      Good:      amber bg/text
      Fair:      orange bg/text
      Poor:      rose bg/text
    Seller row: circular avatar 20px + seller name, Manrope 500, on-surface-variant

ALL LISTINGS GRID:
  2-column grid (mobile), 3-4 columns (desktop)
  Same ListingCard style

FILTER BAR:
  Condition filter pills: All | New | Like New | Good | Fair | Poor
  Price range (optional)
```

---

## 9. MESSAGES SCREEN

```
Design the Messages screen for Ludify — direct messages between players.

Background: surface (#040d22)

HEADER:
  "Messages" title + search icon (right)
  
SEARCH BAR (when expanded):
  Same style as Events search bar

CONVERSATION LIST:
  Vertical list, gap: 0.75rem, no dividers
  Each ConversationRow:
    Avatar (48px circle) + unread badge (secondary color, top-right of avatar)
    Name: Plus Jakarta Sans 600, on-surface
    Last message preview: Manrope 400, on-surface-variant, 1 line, 13px
    Timestamp: Manrope 500, on-surface-variant, 11px (right-aligned)
    Unread: bold name + bold preview text

MESSAGE THREAD (when conversation opened):
  Full screen, header shows recipient name + avatar
  Messages bubbles:
    Own messages: secondary (#ff6f7e) background, white text, radius-xl, radius-md bottom-right, right-aligned
    Others' messages: surface-container-high bg, on-surface text, radius-xl, radius-md bottom-left, left-aligned
  Input bar (sticky bottom):
    Glassmorphism bg, text input (surface-container-high), send button (primary color icon)
```

---

## 10. PROFILE SCREEN

```
Design the Profile screen for Ludify.

Background: surface (#040d22)

HERO SECTION:
  Large avatar (96px circle) centered, primary ring (2px) around it
  Display name: Plus Jakarta Sans 800, on-surface, centered
  Location + BGG username: Manrope 500, on-surface-variant, centered
  Stats row: 3 columns — Events Hosted | Events Joined | Games Owned
    Each stat: number (Plus Jakarta Sans 800, primary) + label (Manrope 500, on-surface-variant)
  CTA row: "Edit Profile" (surface-container-high bg, primary text) | "Add Friends" (secondary bg)

TABS:
  Collection | Activity | Reviews

COLLECTION TAB:
  Search/filter bar
  Grid of game thumbnails (3 columns), each with game name below, radius-xl
  
ACTIVITY TAB:
  Vertical feed of past events attended/hosted, EventListCard style

REVIEWS TAB:
  Rating summary (avg stars, count)
  List of reviews: avatar + name + star rating + review text + date
```

---

## 11. EVENT DETAIL SCREEN

```
Design the Event Detail screen for Ludify.

Background: surface (#040d22)

HERO:
  Full-width game art (top, 40% of screen)
  Gradient overlay on bottom half of image
  EventStatusBadge overlaid top-right
  Back button top-left (circular, surface/70% blur)

CONTENT (below hero, surface-container bg, -12px margin-top overlap with radius-xl):
  Game title: Plus Jakarta Sans 800, on-surface, large
  Date + time: primary (#a3a6ff), Manrope 600
  Address: pin icon + address, on-surface-variant
  
  HOST ROW:
    Host avatar (48px) + "Hosted by [Name]" (Plus Jakarta Sans 600)
    Message host button (right, surface-container-high bg)
  
  PLAYERS SECTION:
    "Players (X/Y)" section header
    Horizontal row of player avatar circles (40px), overflow shown as "+N"
    Each avatar: primary ring if friend, neutral otherwise
    
  ABOUT / DESCRIPTION:
    Collapsible text block, Manrope 400, on-surface-variant
    
  GAME RECOMMENDATIONS:
    Horizontal cards of related games from BGG
    
  CTA (sticky bottom bar):
    "Join Event" button (full-width, secondary #ff6f7e, radius-md, 48px height)
    OR "Leave Event" (surface-container-high, error text)
    OR "Manage Event" (primary bg, for hosts)
```

---

## 12. CREATE EVENT SCREEN

```
Design the Create Event screen for Ludify.

Background: surface (#040d22)

HEADER:
  "Create Game Night" — Plus Jakarta Sans 800
  "Cancel" link (left, on-surface-variant)

FORM (vertical, gap: 1.5rem, padding: 1.4rem):
  All inputs:
    Background: surface-container-high (#121f3b)
    No border by default — ghost border (outline-variant 15% opacity) on focus
    Radius: radius-md (0.75rem)
    Label: Plus Jakarta Sans 600, on-surface, 13px, above input
    Placeholder: on-surface-variant
    
  GAME SEARCH INPUT:
    With BGG game search autocomplete
    Selected game shows thumbnail (40px) + name chip in primary bg

  DATE & TIME: Date picker row + Time picker row

  LOCATION: Address input with location pin icon

  MAX PLAYERS: Number stepper (− / N / +)

  DESCRIPTION: Multiline textarea, 4 rows

  VISIBILITY: Toggle pills — Public | Friends Only | Private

CTA (bottom, sticky):
  "Create Event" button — full-width, secondary (#ff6f7e), radius-md, 56px height
```

---

## 13. ONBOARDING MODAL

```
Design the onboarding modal for new Ludify users.

Overlay: black at 60% opacity
Modal: surface-container (#0f1c36), radius-xl, max-width 400px, centered

HEADER:
  Purple-to-indigo gradient background section
  Dice emoji (large, centered)
  "Welcome to Ludify!" — Plus Jakarta Sans 800, white
  Tagline — Manrope 400, white at 80% opacity

ACTION CARDS (3 vertical stacked cards, each clickable):
  Card bg: surface-container-high, radius-xl
  Icon (32px, primary or secondary colored) + Title (Plus Jakarta Sans 700) + Description (Manrope 400, on-surface-variant)
  Cards: "Browse Events" | "Add Your Collection" | "Find Friends"

FOOTER:
  "Skip for now" — Manrope 500, on-surface-variant, centered, underline on hover
```

---

## 14. FOOTER (Desktop Only)

```
Design the desktop footer for Ludify.

Shown only on desktop, hidden on mobile.
Background: surface-container-low (#0a1428)
Height: 64px
Horizontal padding: 24px

Layout (left → center → right):
  LEFT: "Ludify" wordmark (primary color, Plus Jakarta Sans 700) + "© 2025" (Manrope 400, on-surface-variant)
  CENTER: Links row — Instagram (@ludify.app) | FAQ | Contact (hello@ludify.app)
    Link style: Manrope 500, on-surface-variant, hover → primary
  RIGHT: "Powered by BoardGameGeek" badge — small BGG logo + text, on-surface-variant
```

---

## STITCH WORKFLOW TIPS

1. Start by pasting the **Design System** prompt first to seed all tokens and rules.
2. Generate **Navigation Bar** and **Bottom Nav** next — these appear on every screen.
3. Build **For You** and **Events** tabs — they're the core experience.
4. Add **Dropdown Menu**, **Friend Story Overlay**, then remaining screens.
5. For each screen, paste the prompt, generate, then refine with follow-up prompts like:
   - "Apply the No-Line Rule — remove all 1px borders, use background shifts instead"
   - "Make the game art the hero — increase image size, reduce text visual weight"
   - "Apply glassmorphism to the header — surface at 60% opacity, 20px backdrop blur"
   - "Increase typography weight on headings to 800, tighten letter-spacing to -0.02em"
