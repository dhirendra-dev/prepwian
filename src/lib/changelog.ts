/**
 * Site changelog / update history.
 *
 * Pure static data — no backend needed. Add a new entry at the TOP of the
 * array every time something ships. `date` is ISO (YYYY-MM-DD).
 */

export type ChangeKind = "feature" | "improvement" | "fix" | "security" | "design";

export type ChangeItem = {
  kind: ChangeKind;
  title: string;
  detail?: string;
  area?: string;
  commit?: string;
};

export type ChangelogDay = {
  date: string;
  version?: string;
  headline?: string;
  items: ChangeItem[];
};

export const kindMeta: Record<ChangeKind, { label: string; className: string }> = {
  feature: { label: "New", className: "bg-primary/15 text-primary" },
  improvement: { label: "Improved", className: "bg-accent/15 text-accent" },
  fix: { label: "Fixed", className: "bg-chemistry/15 text-chemistry" },
  security: { label: "Security", className: "bg-destructive/15 text-destructive" },
  design: { label: "Design", className: "bg-mathematics/15 text-mathematics" },
};

export const changelog: ChangelogDay[] = [
  {
    date: "2026-10-12",
    items: [
      {
        kind: "feature",
        area: "Navigation",
        title: "Add About Us and Official navigation links",
        detail:
          "Added About Us and Official destinations to the app launcher and feature menu, registered the About route, and updated homepage content and links.",
        commit: "1191a69",
      },
      {
        kind: "improvement",
        area: "Forum",
        title: "Upgrade forum threads",
        detail:
          "Reworked the authenticated forum route and added a database migration for thread enhancements, including changes to the thread experience and its supporting schema.",
        commit: "46bf333",
      },
      {
        kind: "design",
        area: "Navigation",
        title: "Redesign the app launcher and feature menu",
        detail:
          "Reworked the app launcher and feature menu, including navigation for Engineering, About, Official, and other site sections.",
        commit: "84b82d1",
      },
      {
        kind: "fix",
        area: "Navigation",
        title: "Fix mobile drawer dark background",
        detail: "Adjusted the feature drawer and added styles for its dark appearance on mobile.",
        commit: "08331fd",
      },
      {
        kind: "design",
        area: "Articles",
        title: "Refine article dark theme",
        detail: "Expanded article-section styles to improve its presentation under the dark theme.",
        commit: "388375c",
      },
      {
        kind: "design",
        area: "Branding",
        title: "Increase the logo splash visibility",
        detail: "Adjusted the logo splash presentation and visibility.",
        commit: "9fd82ec",
      },
      {
        kind: "improvement",
        area: "Interaction design",
        title: "Polish motion and touch feedback",
        detail:
          "Adjusted cross-route motion, splash behavior, button and sheet interactions, and theme handling to refine animation and touch feedback.",
        commit: "6568b14",
      },
      {
        kind: "fix",
        area: "Navigation",
        title: "Fix mobile feature drawer dark mode",
        detail:
          "Updated the feature drawer layout and styles to address its mobile dark-mode presentation.",
        commit: "5a60d6e",
      },
      {
        kind: "fix",
        area: "Quiz Arena",
        title: "Remove the duplicate quiz-page footer",
        detail: "Removed the duplicate footer from the quiz index page.",
        commit: "2f7fa99",
      },
      {
        kind: "fix",
        area: "Admin",
        title: "Fix mobile admin layout and TypeScript errors",
        detail:
          "Adjusted admin navigation and app-shell layout and corrected related quiz and certificate route typing/layout issues; removed substantial content from the audit route.",
        commit: "91ca9a8",
      },
      {
        kind: "improvement",
        area: "Admin",
        title: "Improve responsive admin workspace and tooling",
        detail:
          "Added admin navigation and saved views, and substantially revised admin workspaces for appeals, audit, contact, moderation, security, system, and user management.",
        commit: "1d09cae",
      },
      {
        kind: "design",
        area: "Certificates",
        title: "Refresh certificates page with glass UI",
        detail:
          "Reworked the authenticated certificates page with a liquid-glass visual treatment and revised page structure.",
        commit: "6c30b5d",
      },
      {
        kind: "feature",
        area: "Certificates",
        title: "Expand configurable certificate system",
        detail:
          "Added a certificate catalog, configurable issuance/admin functions, verification and follow-channel updates, and a database migration supporting the expanded certificate system.",
        commit: "4c18de8",
      },
      {
        kind: "fix",
        area: "Certificates",
        title: "Render ornate Unicode-safe certificates",
        detail:
          "Reworked certificate PDF generation and added a Devanagari font asset; updated certificate display and verification routes to support the revised rendering.",
        commit: "197544d",
      },
      {
        kind: "feature",
        area: "Certificates",
        title: "Add premium certificate system",
        detail:
          "Introduced premium certificate generation, administration, display, and verification flows, with supporting database schema and signature artwork.",
        commit: "7c545bf",
      },
      {
        kind: "fix",
        area: "Quiz Arena",
        title: "Widen arena cards on mobile",
        detail: "Adjusted the quiz arena card width for mobile screens.",
        commit: "55a5599",
      },
      {
        kind: "fix",
        area: "Navigation",
        title: "Align unread direct-message badge",
        detail:
          "Adjusted the direct-message shortcut badge positioning and added supporting styles.",
        commit: "a786a55",
      },
      {
        kind: "fix",
        area: "Engineering page",
        title: "Hide the global header on the engineering page",
        detail: "Updated root-layout header handling for the engineering route.",
        commit: "88bcfba",
      },
      {
        kind: "fix",
        area: "Authentication",
        title: "Hide the global header on sign-in",
        detail:
          "Updated root-layout header handling so the sign-in page does not render the global header.",
        commit: "6862ebe",
      },
      {
        kind: "feature",
        area: "Quiz arena",
        title: "Add live quiz battles and friend challenges",
        detail:
          "Added multiplayer quiz arena panels and battle routes, with quiz-arena helpers and updates to quiz landing/navigation flows.",
        commit: "6fafe72",
      },
      {
        kind: "design",
        area: "Squads",
        title: "Redesign squad group information",
        detail: "Reworked the squad group route layout and information presentation.",
        commit: "163eac6",
      },
      {
        kind: "fix",
        area: "Dashboard",
        title: "Wrap dashboard planner previews",
        detail:
          "Adjusted classic dashboard planner previews so their content wraps within the available layout.",
        commit: "1d37795",
      },
      {
        kind: "feature",
        area: "Messaging",
        title: "Add squad conversation read state",
        detail:
          "Added conversation read-state support across messaging and squad views, backed by a database migration.",
        commit: "771515a",
      },
      {
        kind: "fix",
        area: "Dashboard",
        title: "Show the workspace section in classic layouts",
        detail: "Added the workspace section to the customizable classic dashboard layout.",
        commit: "59fe31c",
      },
      {
        kind: "fix",
        area: "Dashboard",
        title: "Harden dashboard watch-party preview",
        detail: "Reworked the classic dashboard watch-party preview handling and layout.",
        commit: "fa78cb1",
      },
      {
        kind: "fix",
        area: "Watch parties",
        title: "Show discoverable watch-party rooms",
        detail:
          "Updated the watch-room listing query and presentation so the page can display the full set of discoverable rooms.",
        commit: "670ebcc",
      },
      {
        kind: "feature",
        area: "Dashboard",
        title: "Add workspace previews to classic dashboard",
        detail:
          "Added full workspace preview sections to the classic dashboard and connected them to the dashboard route.",
        commit: "0d1d5d7",
      },
      {
        kind: "design",
        area: "Focus",
        title: "Redesign focus zone for mobile",
        detail:
          "Reworked the focus landing and index routes with a mobile-oriented focus-zone layout.",
        commit: "713c443",
      },
      {
        kind: "fix",
        area: "Mobile navigation",
        title: "Hide the global header on immersive mobile screens",
        detail:
          "Updated route/layout handling to suppress the global header on selected immersive mobile screens.",
        commit: "be2ebf5",
      },
      {
        kind: "fix",
        area: "Community",
        title: "Repair community feed interactions and persistence",
        detail:
          "Updated feed components and data helpers to repair feed interactions and persistence behavior.",
        commit: "5e10bb8",
      },
      {
        kind: "fix",
        area: "Pulse",
        title: "Make pulse subject tabs scroll on mobile",
        detail: "Adjusted the subject-tab row so it can scroll on mobile screens.",
        commit: "d8647ec",
      },
      {
        kind: "improvement",
        area: "Watch parties",
        title: "Improve mobile live-room chat and menu",
        detail: "Reworked live-room chat and menu controls for the mobile layout.",
        commit: "ab3b63a",
      },
      {
        kind: "fix",
        area: "Global navigation",
        title: "Restore the shared header outside immersive views",
        detail:
          "Adjusted root and Watch Party route handling so the global header remains available outside the community and party-room views.",
        commit: "01ed98f",
      },
      {
        kind: "fix",
        area: "Watch parties",
        title: "Make watch-party room responsive",
        detail: "Adjusted the watch-party room layout for mobile-sized screens.",
        commit: "f58aeac",
      },
      {
        kind: "fix",
        area: "Global navigation",
        title: "Scope the shared header to articles and Watch Party lobby",
        detail:
          "Adjusted route matching so the shared header is limited to the intended article and lobby views.",
        commit: "41cfb4d",
      },
      {
        kind: "fix",
        area: "Community",
        title: "Hide the shared header on the live community screen",
        detail: "Adjusted root-layout header rules for the immersive live-community view.",
        commit: "cf7e085",
      },
      {
        kind: "improvement",
        area: "Global navigation",
        title: "Add a default shared header to routes",
        detail:
          "Introduced shared-header fallback behavior for routes without a route-specific header.",
        commit: "548d117",
      },
      {
        kind: "fix",
        area: "Articles",
        title: "Normalize article content rendering",
        detail:
          "Added shared article-content normalization and updated markdown rendering and styles to handle article content consistently.",
        commit: "3d3de93",
      },
      {
        kind: "design",
        area: "Notifications",
        title: "Highlight high-priority inbox alerts",
        detail:
          "Added visual highlighting for high-priority notifications in the notification bell inbox.",
        commit: "4bcebb6",
      },
      {
        kind: "feature",
        area: "Notifications",
        title: "Add high-priority JEE alert controls",
        detail:
          "Added JEE alert preference handling, a listener, settings and admin controls, and supporting database fields/migration.",
        commit: "1ceea76",
      },
      {
        kind: "fix",
        area: "Notifications",
        title: "Widen the notification inbox popover",
        detail: "Adjusted the notification inbox popover width.",
        commit: "410eca9",
      },
      {
        kind: "fix",
        area: "Settings",
        title: "Fit appearance settings on mobile",
        detail:
          "Added mobile-specific appearance-settings styles and revised the settings component layout for smaller screens.",
        commit: "8d6aa62",
      },
      {
        kind: "feature",
        area: "Appearance",
        title: "Add Scholar Desk typography controls",
        detail:
          "Added typography preference utilities and settings controls for the Scholar Desk mode, with corresponding global styles.",
        commit: "c3da2cc",
      },
      {
        kind: "design",
        area: "Appearance",
        title: "Redesign legacy skin as Scholar Desk",
        detail:
          "Renamed and restyled the legacy appearance mode as Scholar Desk in settings and global styles.",
        commit: "00cbe9c",
      },
      {
        kind: "improvement",
        area: "Appearance",
        title: "Expand theme presets and widget colors",
        detail:
          "Added theme presets and widget color controls to the customizable dashboard and settings, with supporting color styles.",
        commit: "8d5e011",
      },
      {
        kind: "feature",
        area: "Dashboard",
        title: "Add customizable drag-and-drop dashboard",
        detail:
          "Introduced a customizable dashboard layout with drag-and-drop widget arrangement and dashboard/settings integration.",
        commit: "a29d7ab",
      },
      {
        kind: "feature",
        area: "Appearance",
        title: "Add page background color controls",
        detail:
          "Added background-color settings and shared color handling so users can customize page backgrounds.",
        commit: "76027fa",
      },
      {
        kind: "improvement",
        area: "Appearance",
        title: "Expand site-wide theme customization",
        detail:
          "Added more appearance controls and palette/motion options, with global styles and settings support.",
        commit: "8284822",
      },
      {
        kind: "feature",
        area: "Account",
        title: "Export user-owned account data",
        detail:
          "Added account data export functions and integrated the export controls into settings.",
        commit: "fecd2a4",
      },
      {
        kind: "design",
        area: "Settings",
        title: "Redesign the settings dashboard",
        detail:
          "Added the shared public header and a refreshed settings-dashboard layout with a broader control-center presentation.",
        commit: "87fa313",
      },
      {
        kind: "feature",
        area: "Settings",
        title: "Add study and appearance controls",
        detail: "Added study and appearance controls to the settings page.",
        commit: "b6eef0c",
      },
      {
        kind: "improvement",
        area: "Settings",
        title: "Improve settings navigation and activity controls",
        detail: "Reworked settings navigation and added or refined account-activity controls.",
        commit: "dd49b38",
      },
      {
        kind: "feature",
        area: "Settings",
        title: "Add account activity and data controls",
        detail:
          "Added account activity and data-management controls to settings, with supporting account functions.",
        commit: "fc692f3",
      },
      {
        kind: "fix",
        area: "Watch parties",
        title: "Keep watch-party controls accessible on mobile",
        detail:
          "Reworked watch-room controls and layout so key controls remain accessible on mobile.",
        commit: "61acbc4",
      },
      {
        kind: "feature",
        area: "Quiz arena",
        title: "Add live quiz arena",
        detail:
          "Added a live-arena quiz component and connected it to the quiz route/player with supporting styling and roadmap updates.",
        commit: "ba74577",
      },
      {
        kind: "feature",
        area: "Quiz Arena",
        title: "Add live quiz-battle matchmaking and rooms",
        detail:
          "Added the live-arena component with matchmaking, room creation/joining, invitations, and battle-state handling through quiz-battle RPCs.",
        commit: "e0d2e48",
      },
      {
        kind: "feature",
        area: "Quiz arena",
        title: "Enable quiz challenges with friends",
        detail:
          "Added a friend-challenge dialog and integrated challenge actions into quiz and direct-message flows.",
        commit: "536fc68",
      },
      {
        kind: "design",
        area: "Watch parties",
        title: "Redesign watch-party lobby for mobile",
        detail:
          "Reworked the watch-party lobby route to match a mobile-oriented reference and added a study-hero image asset.",
        commit: "d044051",
      },
      {
        kind: "design",
        area: "Theme",
        title: "Improve dark-mode contrast across the app",
        detail:
          "Adjusted shared and feature-specific theme styles to improve contrast in dark mode.",
        commit: "68205be",
      },
      {
        kind: "design",
        area: "Watch Party",
        title: "Redesign Watch Party for light and dark themes",
        detail:
          "Reworked the watch-party lobby, room, and party-start surfaces for both color themes.",
        commit: "fef5fca",
      },
      {
        kind: "design",
        area: "Articles",
        title: "Add spacing above article entry cards",
        detail: "Adjusted spacing above the homepage article-entry cards.",
        commit: "6c834a1",
      },
      {
        kind: "design",
        area: "Articles",
        title: "Align article entry cards with the homepage glass UI",
        detail: "Updated article entry-card styling to match the homepage glass-card treatment.",
        commit: "2bf0a1b",
      },
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Keep the mobile dashboard fix focused",
        detail:
          "Narrowed the dashboard workspace change to the mobile view-selector fix, removing unrelated workspace edits from the preceding revision.",
        commit: "9f4740d",
      },
      {
        kind: "fix",
        area: "Dashboard",
        title: "Fix mobile dashboard view-selector overflow",
        detail:
          "Reworked dashboard workspace layout and selector sizing to prevent overflow on mobile.",
        commit: "5d44b77",
      },
      {
        kind: "feature",
        area: "Quiz Arena",
        title: "Add a spaced-recall sprint",
        detail: "Added a recall-sprint activity to the Quiz Arena.",
        commit: "1845a4e",
      },
      {
        kind: "fix",
        area: "Quiz Arena",
        title: "Keep the quiz overlay above page content",
        detail:
          "Adjusted quiz-play overlay layering so the active challenge stays above surrounding site UI.",
        commit: "d4e012d",
      },
      {
        kind: "design",
        area: "Quiz Arena",
        title: "Make the quiz arena theme-aware",
        detail: "Updated arena and quiz-play surfaces to use the site’s active theme.",
        commit: "9ded4d7",
      },
      {
        kind: "design",
        area: "Quiz Arena",
        title: "Redesign quiz challenges and the battle player",
        detail:
          "Added the arena home and quiz-play interfaces and connected them to the quiz route.",
        commit: "064852c",
      },
      {
        kind: "fix",
        area: "Mobile navigation",
        title: "Restore mobile menu and button interactions",
        detail:
          "Reworked feature-menu interactions and reduced motion-component behavior to restore mobile controls.",
        commit: "14067d4",
      },
      {
        kind: "fix",
        area: "Community promotion",
        title: "Keep the community promo from blocking the menu",
        detail: "Adjusted the promotional popup behavior so it does not obstruct menu interaction.",
        commit: "b242ecb",
      },
      {
        kind: "design",
        area: "Interactions",
        title: "Animate button and menu interactions",
        detail: "Added animation support for button and menu interactions.",
        commit: "c70c6bc",
      },
      {
        kind: "feature",
        area: "Branding",
        title: "Show the logo splash only on website entry",
        detail:
          "Changed logo-splash behavior so it appears on website entry rather than every in-app navigation.",
        commit: "5ccb2de",
      },
      {
        kind: "fix",
        area: "Authentication and welcome flow",
        title: "Prevent unwanted reloads and repeated welcome popups",
        detail:
          "Adjusted consent and membership-welcome handling to prevent unnecessary reloads and repeated popup displays.",
        commit: "cfd459e",
      },
      {
        kind: "improvement",
        area: "Study library",
        title: "Speed up study-library search",
        detail:
          "Updated materials and notes search behavior to reduce unnecessary work while filtering.",
        commit: "0b83a07",
      },
      {
        kind: "improvement",
        area: "Feature menu",
        title: "Improve feature-menu interaction performance",
        detail:
          "Refined feature-menu styling and interaction behavior to make menu transitions more responsive.",
        commit: "2781dc1",
      },
      {
        kind: "feature",
        area: "Accessibility and motion",
        title: "Add an accessible global motion system",
        detail:
          "Added a shared motion component and updated the button system to support the site’s motion behavior.",
        commit: "4beb6be",
      },
      {
        kind: "improvement",
        area: "Community",
        title: "Smooth mobile community scrolling",
        detail:
          "Adjusted feed and community-chat rendering behavior for smoother mobile scrolling.",
        commit: "e39d623",
      },
    ],
  },
  {
    date: "2026-10-11",
    items: [
      {
        kind: "improvement",
        area: "AI and test-player performance",
        title: "Lazy-load math rendering and test calculator",
        detail:
          "Adds lazy-loaded math rendering and a calculator panel, then integrates them into AI chat, SahAI, and test-taking interfaces to defer those components until needed.",
        commit: "6cca182",
      },
      {
        kind: "improvement",
        area: "Feed / data fetching",
        title: "Batch feed assets and tune query caching",
        detail:
          "Updates feed data handling to batch asset retrieval and adjusts router query-cache configuration.",
        commit: "26f7147",
      },
      {
        kind: "improvement",
        area: "Mobile performance",
        title: "Reduce mobile startup and article-loading cost",
        detail:
          "Updates app startup and authentication handling and changes article loading behavior to reduce work on mobile. Also adjusts shared styles and the maintenance guard.",
        commit: "08b909b",
      },
      {
        kind: "fix",
        area: "Articles / routing",
        title: "Route article permalinks correctly",
        detail:
          "Adds an article index route and updates article routing and route-tree registration to resolve article permalinks correctly.",
        commit: "d80ea81",
      },
      {
        kind: "improvement",
        area: "Articles / navigation",
        title: "Open articles in place",
        detail:
          "Changes article selection in the hub to open articles in the current page rather than navigating away to a separate browsing context.",
        commit: "bdd8e3a",
      },
      {
        kind: "fix",
        area: "Articles / author profiles",
        title: "Fix article author profile links",
        detail:
          "Adds shared author-link handling and updates article cards and user-profile routing to link authors to their profile pages.",
        commit: "edfd1c3",
      },
      {
        kind: "fix",
        area: "Articles / author profiles",
        title: "Resolve article authors from profiles",
        detail:
          "Updates the article editor and hub to resolve author information through profile records rather than relying solely on existing article data.",
        commit: "f143f16",
      },
      {
        kind: "design",
        area: "Articles / styling",
        title: "Restore Articles light-mode contrast",
        detail:
          "Adjusts the engineering-themed article stylesheet to improve text and interface contrast in light mode.",
        commit: "9c8406e",
      },
      {
        kind: "improvement",
        area: "Articles / discovery and design",
        title: "Add social discovery to articles hub",
        detail:
          "Updates the article hub and app navigation for social discovery and adds an engineering-themed article presentation stylesheet. The change also updates article styling and public-header navigation.",
        commit: "13a05ab",
      },
      {
        kind: "fix",
        area: "Quiz Arena",
        title: "Restore Quiz Arena lock icon import",
        detail: "Restores the lock-icon import used by the Quiz Arena route.",
        commit: "716fa34",
      },
      {
        kind: "design",
        area: "Quiz Arena",
        title: "Redesign Quiz Arena battle experience",
        detail:
          "Adds a new battle-arena component and stylesheet and integrates them into the quiz route, replacing the prior battle presentation with a redesigned competitive experience.",
        commit: "b969d4b",
      },
      {
        kind: "improvement",
        area: "Articles / homepage and authentication",
        title: "Integrate articles into homepage and sign-in flow",
        detail:
          "Adds an articles section to the homepage and a post-login destination chooser, with supporting sign-in success overlay and route changes. Also updates public navigation and article-hub behavior.",
        commit: "d887a20",
      },
      {
        kind: "feature",
        area: "Articles",
        title: "Add articles hub and post-login chooser",
        detail:
          "Introduces article listing and detail routes, author dashboard and editor components, supporting styles, database migration, seed content, and setup documentation. Adds a start route and authentication-flow integration for the post-sign-in destination chooser.",
        commit: "5ec765b",
      },
      {
        kind: "fix",
        area: "Quiz Arena",
        title: "Fix Quiz Arena online indicator",
        detail: "Corrects the Quiz Arena avatar's online-status indicator in the quiz route.",
        commit: "089f78b",
      },
      {
        kind: "design",
        area: "Quiz Arena",
        title: "Polish Quiz Arena light and dark themes",
        detail: "Adjusted the Quiz Arena route styling for the light and dark themes.",
        commit: "44abfa6",
      },
      {
        kind: "design",
        area: "Quiz Arena",
        title: "Redesign the competitive Quiz Arena",
        detail:
          "Reworked the quiz route’s competitive battle presentation and integrated the refreshed arena flow.",
        commit: "ecd5579",
      },
      {
        kind: "design",
        area: "Test player",
        title: "Replace mobile test-player interface",
        detail:
          "Adds reusable test-player components and replaces the attempt page's mobile presentation with a redesigned player interface.",
        commit: "62eee70",
      },
      {
        kind: "feature",
        area: "Feature navigation",
        title: "Add AI tools to feature slide menu",
        detail:
          "Updates the feature slide menu to expose additional AI features. The change is limited to the menu component.",
        commit: "f7f5e48",
      },
      {
        kind: "security",
        area: "Admin / AI and system controls",
        title: "Add centralized AI and system controls",
        detail:
          "Adds an administrator system-controls route and server functions, centralizes AI/system settings and secret handling, and updates AI, community, SahAI, and test-creation flows to use those controls. Includes setup documentation and a database migration for system secrets.",
        commit: "3d9dff1",
      },
      {
        kind: "security",
        area: "Database / system secrets",
        title: "Add admin system-secrets schema",
        detail:
          "Adds a Supabase migration for administrator-managed system secrets, including schema and access-control policy changes. The migration also supports storing provider/configuration metadata for the secret records.",
        commit: "9a4e143",
      },
      {
        kind: "security",
        area: "System secrets / AI providers",
        title: "Add server-side system-secret retrieval",
        detail:
          "Adds a server-only helper that retrieves enabled system-secret configuration and returns provider-specific secret values. The helper supports OpenAI, Anthropic, Gemini, Groq, and custom providers.",
        commit: "a924acb",
      },
      {
        kind: "improvement",
        area: "Test player",
        title: "Expand test-taking interface and question support",
        detail:
          "Reworks the test attempt page with support for image-rich questions and options, numeric/range questions, section-aware grouping, answer-state tracking, keyboard navigation, and save-state feedback. It also adds question navigation and related player controls.",
        commit: "a7b261e",
      },
      {
        kind: "improvement",
        area: "Admin test editor",
        title: "Extend admin test and question editor",
        detail:
          "Adds test-series configuration fields and question metadata to the admin editor and its server-side validation, including sections, navigation and solution settings, question images, difficulty/topic, and marking options.",
        commit: "986745d",
      },
      {
        kind: "improvement",
        area: "Admin test editor",
        title: "Add question media and answer-range editing",
        detail:
          "Adds image upload and editing support for questions and answer options, and introduces range-question inputs and validation in the admin test editor. The editor also saves additional question metadata, including topic, difficulty, section, unanswered marks, and solution content.",
        commit: "1d28f21",
      },
      {
        kind: "improvement",
        area: "Test-series API",
        title: "Add server-side test-series question fields",
        detail:
          "Extends question input validation with image references, topic/difficulty/category/section metadata, answer ranges, partial and unanswered marking, solution content and images, and archived state.",
        commit: "2b00596",
      },
      {
        kind: "improvement",
        area: "Test-series API",
        title: "Validate expanded test-series settings",
        detail:
          "Adds validation for test sections, navigation and solution visibility settings, and default marking schemes. Question and option inputs are extended to accept image references and solution-related fields while allowing image-only question or option content.",
        commit: "759e565",
      },
    ],
  },
  {
    date: "2026-10-10",
    items: [
      {
        kind: "improvement",
        area: "Pro and Focus dashboards",
        title: "Update Pro dashboard and focus widgets",
        detail:
          "Adds and revises dashboard widget components, including changes to ProWidgets.tsx and FocusPanel.tsx, and updates DashboardWorkspace and ProDashboard integration. The changes refine the Pro/Focus dashboard widget presentation and behavior.",
        commit: "c22655f",
      },
      {
        kind: "design",
        area: "Focus dashboard",
        title: "Redesign the Focus dashboard workspace",
        detail:
          "Reworks DashboardWorkspace with a dashboard-mode switcher, greeting and study-focus layout, and weekly-target progress and remaining-time calculations. The dashboard styling shifts to shared theme tokens and card-based sections.",
        commit: "60a01b1",
      },
      {
        kind: "feature",
        area: "Dashboard widgets",
        title: "Add classic dashboard widgets and revise Pro focus panels",
        detail:
          "Introduces ClassicProWidgets.tsx and updates ProWidgets.tsx and FocusPanel.tsx. The code adds a separate set of dashboard widgets while changing existing Pro dashboard and focus-panel components.",
        commit: "b222f2b",
      },
    ],
  },
  {
    date: "2026-10-09",
    items: [
      {
        kind: "design",
        area: "Pro dashboard",
        title: "Restyle Pro dashboard",
        detail:
          "Updates the Pro dashboard layout and styling, including its horizontal action navigation and learning-resume card, with the new theme tokens and progress presentation.",
        commit: "1fe9cd6",
      },
      {
        kind: "security",
        area: "Database security",
        title: "Restrict test-table access to admins",
        detail: "Adds database policies that lock test-related tables to admin access.",
        commit: "508b931",
      },
      {
        kind: "improvement",
        area: "Test Series",
        title: "Use test engine in attempt grading and results",
        detail:
          "Refactors attempt grading to call the shared test engine and extends result retrieval with solution-visibility checks, archived-question filtering, and signed image URLs.",
        commit: "bf838d2",
      },
      {
        kind: "feature",
        area: "Test engine",
        title: "Add server-side test engine",
        detail:
          "Adds server-only test engine utilities for grading questions, validating question content, and collecting/signing image paths. Grading supports numeric ranges and partial-marking schemes for multi-select questions.",
        commit: "87145e7",
      },
      {
        kind: "feature",
        area: "Test Series",
        title: "Add Test Series v2 schema",
        detail:
          "Introduces the Test Series v2 database schema migration and updates generated Supabase TypeScript types for the new schema.",
        commit: "ef4f180",
      },
      {
        kind: "security",
        area: "Database access control",
        title: "Restrict unused schema tables to admins",
        detail:
          "Added an RLS migration limiting access to unused reference/schema tables to administrator roles.",
        commit: "081343d",
      },
      {
        kind: "security",
        area: "Database security",
        title: "Add migration locking unused reference tables",
        detail:
          "Adds a database migration that applies restrictive row-level security policies to reference tables not used by the application, locking down access through table policies.",
        commit: "e9e8771",
      },
    ],
  },
  {
    date: "2026-10-08",
    items: [
      {
        kind: "fix",
        area: "Authentication / account verification",
        title: "Update verification state immediately on success event",
        detail:
          "Sets the gate’s verified state immediately when it receives the account-verified event, then starts the verification recheck. This avoids continuing to treat the user as unverified while that check completes.",
        commit: "d70a0bb",
      },
      {
        kind: "fix",
        area: "Authentication / account verification",
        title: "Refresh verification gate after account verification",
        detail:
          "Dispatches an account-verified browser event after successful verification and has the authenticated route gate listen for it to recheck verification status. The listener is removed during cleanup.",
        commit: "e41b924",
      },
      {
        kind: "improvement",
        area: "Authentication / consent and verification routing",
        title: "Stabilize consent and account-verification gates",
        detail:
          "Keeps consent and verification checks from rerunning on every route change, uses cached state to redirect restricted or unverified users, and avoids re-showing a loading state for focus or user-update checks. The same commit removes an unused materials-list variable; no user-facing materials change is represented by that removal alone.",
        commit: "946265a",
      },
      {
        kind: "improvement",
        area: "Study materials",
        title: "Show filtered study materials consistently",
        detail:
          "Uses the filtered material list for both grid and list views and for the empty-state check, rather than only the featured subset. Retains prior query data as placeholder data while fetching, reducing the abrupt data replacement during query changes.",
        commit: "061ee94",
      },
      {
        kind: "feature",
        area: "Admin / account verification",
        title: "Add admin control for verification mode",
        detail:
          "Adds an Account Verification Mode card to the admin verification page, reading and updating the app_settings flag and showing success or error feedback. The control lets admins switch the mode between required and automatic verification.",
        commit: "d73b578",
      },
      {
        kind: "security",
        area: "Database / account verification and RLS",
        title: "Add configurable account verification and restrict reference data",
        detail:
          "Adds an account_verification_required setting and a profile-trigger function that creates pending verifications when enabled or marks new accounts verified automatically when disabled. The migration also changes SELECT policies on student-festival, surrounding-services, and seat-pressure tables to admin-only access.",
        commit: "c1b4fdd",
      },
    ],
  },
  {
    date: "2026-10-07",
    items: [
      {
        kind: "fix",
        area: "Test attempts",
        title: "Validate test answers and surface save errors",
        detail:
          "Checks that a submitted question belongs to the attempt's test before upserting the response, using the admin client for that lookup. The attempt UI now reports answer-save failures instead of silently ignoring them.",
        commit: "cfe0210",
      },
      {
        kind: "security",
        area: "Database access control",
        title: "Restrict reference-table reads to admins",
        detail:
          "Adds a SQL migration replacing authenticated-user SELECT policies with admin-only policies for governance structure history, laboratory inventory, and internet connectivity. Adds Drizzle configuration and dependencies to support the migration.",
        commit: "3fad926",
      },
      {
        kind: "fix",
        area: "Test attempts",
        title: "Retry answer saves before test submission",
        detail:
          "Retries each failed answer save once and waits for all save attempts to settle before submitting. If any answer still fails, submission is stopped and an error is shown rather than grading with potentially unsaved answers.",
        commit: "0fe45a3",
      },
      {
        kind: "fix",
        area: "Test attempts",
        title: "Report failures when saving test answers",
        detail:
          "Updates test answer-saving logic and the attempt screen so a save error is surfaced to the user instead of being silently swallowed.",
        commit: "cc67b22",
      },
      {
        kind: "design",
        area: "App launcher",
        title: "Redesign the app launcher",
        detail:
          "Replaced the launcher implementation with a more compact interaction model and refreshed launcher presentation.",
        commit: "1b1b9a2",
      },
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Update dashboard workspace",
        detail:
          "Changes the DashboardWorkspace component, affecting the dashboard workspace UI or behavior.",
        commit: "0a3e3f2",
      },
      {
        kind: "feature",
        area: "Dashboard / Pro mode",
        title: "Add Pro dashboard and study widgets",
        detail:
          "Adds a Pro route that saves the user's dashboard mode as Pro and redirects to the dashboard, along with Pro dashboard widgets and supporting dashboard, party, watch-party, and certificate changes. The commit also updates the authenticated Pro route and related product components.",
        commit: "2ae6588",
      },
      {
        kind: "improvement",
        area: "Watch parties",
        title: "Adjust party start flow",
        detail:
          "Updates the StartPartySheet component, changing the watch-party creation flow presented to users.",
        commit: "59f3b87",
      },
      {
        kind: "improvement",
        area: "Watch parties / Calendar integration",
        title: "Update party setup and Google Calendar sync",
        detail:
          "Changes the party-start sheet and updates the Google Calendar callback and sync functions. These files cover party setup and calendar integration behavior; the diff does not establish any deployment outcome.",
        commit: "405bc30",
      },
    ],
  },
  {
    date: "2026-10-06",
    items: [
      {
        kind: "improvement",
        area: "Pro entitlement hook",
        title: "Resolve Pro status from active subscriptions",
        detail:
          "Changed `useProStatus` to query the signed-in user's active `pro_subscriptions` records, honoring start and expiry times, and to refresh periodically and on subscription changes. This replaces checking whether the user leads the current week's leaderboard.",
        commit: "90b0a22",
      },
      {
        kind: "fix",
        area: "Google Calendar edge functions",
        title: "Correct Google Calendar byte-array types",
        detail:
          "Updated the `base64ToBytes` return annotation in both Google Calendar callback and sync functions to `Uint8Array<ArrayBuffer>`, addressing the declared crypto byte-array type mismatch. The same annotation remains in the later mainline state.",
        commit: "2a836bd",
      },
    ],
  },
  {
    date: "2026-10-05",
    items: [
      {
        kind: "improvement",
        area: "Watch parties",
        title: "Refactor party creation sheet",
        detail:
          "Restructures StartPartySheet, substantially changing its implementation while retaining its role as the party-creation interface.",
        commit: "9d52d44",
      },
      {
        kind: "improvement",
        area: "Watch parties",
        title: "Improve party source parsing and URL handling",
        detail:
          "Refactors party source types and URL handling in shared party logic, changing how supported source inputs are represented and processed.",
        commit: "9242c8c",
      },
      {
        kind: "design",
        area: "Study materials",
        title: "Redesign study materials interface",
        detail:
          "Reworks the authenticated study-materials page, replacing much of the existing UI and adding updated material presentation and filtering controls.",
        commit: "9656cf3",
      },
      {
        kind: "design",
        area: "Certificates",
        title: "Redesign certificate PDFs",
        detail:
          "Further revises the certificate PDF generator with a new visual design and corresponding generation changes.",
        commit: "fa19933",
      },
      {
        kind: "improvement",
        area: "Certificates",
        title: "Revise certificate PDF generation",
        detail:
          "Substantially rewrites certificate PDF generation, changing its implementation and output composition.",
        commit: "34950f5",
      },
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Render Pro dashboard by mode",
        detail:
          "Updates DashboardWorkspace to render ProDashboard conditionally based on the selected mode.",
        commit: "134a93a",
      },
      {
        kind: "feature",
        area: "Pro dashboard",
        title: "Build Pro dashboard workspace",
        detail:
          "Adds the Pro dashboard workspace component, assembling the new dashboard interface.",
        commit: "1e94a1a",
      },
      {
        kind: "feature",
        area: "Pro dashboard",
        title: "Add Pro dashboard widgets",
        detail: "Introduces a collection of dashboard widgets for the Pro experience.",
        commit: "ad82e4e",
      },
      {
        kind: "feature",
        area: "Pro dashboard",
        title: "Add Pro focus panel",
        detail:
          "Adds a focus-panel component for the Pro dashboard, providing a dedicated focus-oriented interface.",
        commit: "8d344ea",
      },
      {
        kind: "feature",
        area: "Pro dashboard",
        title: "Add Pro dashboard utilities",
        detail: "Adds shared library logic used by the Pro dashboard feature.",
        commit: "3e30d3d",
      },
      {
        kind: "feature",
        area: "Pro dashboard",
        title: "Add Pro dashboard route",
        detail:
          "Introduces an authenticated `/pro` route that serves the new Pro dashboard experience.",
        commit: "37d01f4",
      },
      {
        kind: "improvement",
        area: "Watch parties",
        title: "Update watch route",
        detail:
          "Replaces most of the existing authenticated watch route implementation with a smaller route component, changing how the watch feature is presented and connected.",
        commit: "30983ba",
      },
      {
        kind: "security",
        area: "Authorization / routing",
        title: "Restrict admin-only routes",
        detail:
          "Adds a database migration and route-tree/type updates associated with admin-only route access; the migration introduces database policy changes. The watch route is also adjusted as part of the change.",
        commit: "af04e70",
      },
      {
        kind: "feature",
        area: "Watch parties",
        title: "Add watch-party lobby",
        detail:
          "Introduces the authenticated watch lobby route, which loads and periodically refreshes lobby rooms, groups them by category, and lets users open a room or start a party.",
        commit: "4fb5f0b",
      },
      {
        kind: "feature",
        area: "Watch parties",
        title: "Add party creation sheet",
        detail: "Adds the StartPartySheet interface for creating a watch party.",
        commit: "aa86311",
      },
      {
        kind: "feature",
        area: "Watch parties",
        title: "Add synchronized party player",
        detail: "Introduces a party-player component for playback within a watch-party session.",
        commit: "1c9eaf1",
      },
      {
        kind: "feature",
        area: "Watch parties",
        title: "Add watch-party utilities",
        detail:
          "Adds shared watch-party logic, including category definitions and source-related helper functionality used by the feature.",
        commit: "11992ca",
      },
      {
        kind: "feature",
        area: "Watch parties",
        title: "Add watch-party room experience",
        detail:
          "Adds the room route implementation for a watch-party session, including its room-specific interface and behavior.",
        commit: "bdc7a27",
      },
      {
        kind: "feature",
        area: "Watch parties",
        title: "Add watch route page",
        detail: "Introduces a watch route page implementation for the watch-party feature.",
        commit: "72904f3",
      },
    ],
  },
  {
    date: "2026-10-04",
    items: [
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Reworked dashboard workspace",
        detail:
          "Substantially revised the dashboard workspace component, with extensive changes to its content and interface.",
        commit: "be45729",
      },
      {
        kind: "feature",
        area: "AI settings",
        title: "Added AI configuration settings page",
        detail: "Added an authenticated settings route with controls for AI configuration.",
        commit: "2e77ac1",
      },
      {
        kind: "feature",
        area: "AI study assistance",
        title: "Added AI study assistance panel",
        detail: "Added `AIStudyPanel`, a new component for AI-assisted study support.",
        commit: "4b62224",
      },
      {
        kind: "improvement",
        area: "Profile",
        title: "Refactored profile header structure",
        detail: "Reorganized the profile header component structure.",
        commit: "2b60858",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Updated glass profile header",
        detail: "Changed the profile-header component’s structure and presentation.",
        commit: "e90160c",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Updated profile header themes",
        detail: "Updated theme definitions used by the profile header.",
        commit: "f9be4a1",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Further refine the glass profile header",
        detail: "Further updated the profile-header component’s design and presentation.",
        commit: "fa8c290",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Adjusted profile header themes",
        detail: "Updated profile-header theme definitions.",
        commit: "38f6492",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Updated profile page header",
        detail: "Integrated the glass profile header into the user profile route.",
        commit: "631a51e",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Added glass profile header",
        detail: "Introduced a profile header component with glass-style presentation.",
        commit: "158b767",
      },
      {
        kind: "design",
        area: "Profile",
        title: "Added profile header theme definitions",
        detail: "Added theme definitions in `src/lib/headerThemes.ts` for profile-header styling.",
        commit: "873d33e",
      },
      {
        kind: "design",
        area: "UI styling",
        title: "Refined glass surface effects",
        detail: "Updated glass-surface styles and visual effects.",
        commit: "fe40097",
      },
      {
        kind: "design",
        area: "UI styling",
        title: "Added liquid-glass UI styles",
        detail:
          "Added reusable liquid-glass CSS styles, including hover/active states and fallbacks for reduced motion and browsers without backdrop filtering.",
        commit: "a20e95d",
      },
      {
        kind: "feature",
        area: "Dashboard",
        title: "Added dashboard view switch",
        detail: "Added a component for switching dashboard views.",
        commit: "2bcbf5c",
      },
      {
        kind: "improvement",
        area: "Consent",
        title: "Added restriction status handling",
        detail:
          "Added handling for restriction status in the consent page, including a distinct restricted-user screen and sign-out action.",
        commit: "4a318dc",
      },
      {
        kind: "improvement",
        area: "Admin consents",
        title: "Redesigned admin consent review interface",
        detail:
          "Substantially expanded the admin consents page with a verification-center interface, review state, approval interaction, and refreshed layout.",
        commit: "309d393",
      },
      {
        kind: "improvement",
        area: "Consent",
        title: "Refactored consent saving",
        detail: "Reworked consent-saving logic in the consent route for clearer handling.",
        commit: "d3bffa9",
      },
      {
        kind: "improvement",
        area: "Consent",
        title: "Updated consent route behavior",
        detail:
          "Changed consent-page logic and presentation in `src/routes/_authenticated/consent.tsx`.",
        commit: "a23ea80",
      },
      {
        kind: "improvement",
        area: "Consent",
        title: "Added consent gate handling",
        detail: "Updated `ConsentGate` to handle additional consent-page states and user flow.",
        commit: "4db0d0f",
      },
      {
        kind: "feature",
        area: "Engineering page",
        title: "Created engineering information page",
        detail:
          "Added an engineering route page with content and layout; subsequent commits moved it into the route directory, and the page remained in the project.",
        commit: "aacabfc",
      },
      {
        kind: "improvement",
        area: "App ecosystem",
        title: "Expanded the app ecosystem page",
        detail: "Expanded the `/app` page content and presentation in `src/routes/app.tsx`.",
        commit: "cd9d65d",
      },
      {
        kind: "design",
        area: "Navigation",
        title: "Updated feature slide menu",
        detail: "Changed the feature slide-menu component’s presentation and behavior.",
        commit: "e4c5fb8",
      },
      {
        kind: "improvement",
        area: "JEE Predictor",
        title: "Rendered nested predictor routes",
        detail:
          "Added `Outlet` and `useChildMatches` to the JEE Predictor page so child-route content can render within the parent page.",
        commit: "9561b1d",
      },
      {
        kind: "feature",
        area: "Groups",
        title: "Added group search and UI refinements",
        detail: "Introduced search functionality and related interface enhancements in groups.",
        commit: "7ce71a1",
      },
      {
        kind: "design",
        area: "Watch Party",
        title: "Updated watch-party message presentation",
        detail: "Refactored message display and styling in the watch-party interface.",
        commit: "11fb6c7",
      },
      {
        kind: "design",
        area: "Squads",
        title: "Reworked squad group mobile layout",
        detail:
          "Adjusted the squad group page’s mobile layout styles in `squad.$groupId.tsx`, changing responsive presentation for the group view.",
        commit: "0a9813b",
      },
      {
        kind: "security",
        area: "Watch Party",
        title: "Updated watch-party handling and route metadata",
        detail:
          "Changed watch-party API, validation, player, sidebar, and page behavior, along with related route/menu and calendar updates; the commit also removed watch-party test files. The diffs include adjustments to input validation and YouTube iframe handling.",
        commit: "33e565e",
      },
      {
        kind: "fix",
        area: "Build",
        title: "Removed obsolete watch-party tests",
        detail:
          "Deleted the watch-party test files while retaining a feature-menu syntax correction in the same commit; no product functionality change is evident.",
        commit: "4e34698",
      },
      {
        kind: "fix",
        area: "Lecture tracker",
        title: "Corrected lecture tracker route",
        detail:
          "Changed the lecture tracker route declaration to `/_authenticated/lecture-tracker`.",
        commit: "b13d554",
      },
    ],
  },
  {
    date: "2026-10-03",
    items: [
      {
        kind: "fix",
        area: "Error handling; squad chat",
        title: "Handle unknown route errors and update squad chat composer",
        detail:
          "Updates route error displays to stringify non-Error values, and revises the squad composer to use a single-line input with updated file-upload/send handling. The commit also includes generated Supabase type and route metadata changes.",
        commit: "ff0ea30",
      },
      {
        kind: "improvement",
        area: "JEE predictor; squad chat",
        title: "Refine concept-map and smart-revision flows",
        detail:
          "Adds topic selection and related UI logic to the concept map, and expands smart revision with additional revision-selection behavior. It also changes squad chat composition and removes the attachment preview interaction from the composer.",
        commit: "eea7a4d",
      },
    ],
  },
  {
    date: "2026-10-02",
    items: [
      {
        kind: "feature",
        area: "Smart Calendar",
        title: "Add Google Calendar sync function",
        detail: "Adds a Supabase Edge Function for synchronizing Google Calendar data.",
        commit: "2d099e2",
      },
      {
        kind: "security",
        area: "Smart Calendar",
        title: "Harden Google Calendar integration security",
        detail:
          "Adds a follow-up migration explicitly named as a Google Calendar security fix, updating the integration's database security configuration.",
        commit: "f629ce8",
      },
      {
        kind: "security",
        area: "Smart Calendar",
        title: "Add Google Calendar security policies",
        detail:
          "Introduces a database migration with security-related configuration for Google Calendar integration.",
        commit: "f3c83f6",
      },
      {
        kind: "feature",
        area: "Smart Calendar",
        title: "Add Google Calendar OAuth callback",
        detail:
          "Adds a callback Edge Function for processing the Google Calendar authorization response.",
        commit: "fe7dc62",
      },
      {
        kind: "feature",
        area: "Smart Calendar",
        title: "Add Google Calendar authorization",
        detail:
          "Adds a Supabase Edge Function that initiates Google Calendar authorization and handles the OAuth flow. The function code is introduced in this commit.",
        commit: "d3a09ba",
      },
      {
        kind: "feature",
        area: "Smart Calendar",
        title: "Add Smart Calendar API",
        detail:
          "Adds API functions for the Smart Calendar feature, alongside its types and migration introduced in nearby commits.",
        commit: "bcbb2b8",
      },
      {
        kind: "feature",
        area: "Smart Calendar",
        title: "Add Smart Calendar data model",
        detail: "Adds a database migration defining the Smart Calendar persistence layer.",
        commit: "581c8c3",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add YouTube Checklist route",
        detail: "Adds an authenticated route for the YouTube Checklist feature.",
        commit: "e366832",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add YouTube Checklist page",
        detail: "Adds the main YouTube Checklist page component.",
        commit: "53caf5a",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add YouTube playlist import function",
        detail: "Adds a Supabase Edge Function for importing YouTube playlists.",
        commit: "4289768",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add YouTube checklist player hook",
        detail: "Adds a hook supporting YouTube playback in the checklist feature.",
        commit: "0f66f13",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add floating YouTube player",
        detail: "Adds a floating player component for YouTube checklist playback.",
        commit: "27b55ab",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add YouTube checklist API",
        detail: "Adds API operations for YouTube checklist data.",
        commit: "74c10fa",
      },
      {
        kind: "feature",
        area: "YouTube Checklist",
        title: "Add YouTube checklist database schema",
        detail: "Adds a database migration for YouTube checklists.",
        commit: "fb4f6f5",
      },
      {
        kind: "feature",
        area: "Watch Party",
        title: "Add Watch Party route",
        detail: "Adds an authenticated route for accessing Watch Party.",
        commit: "d3a973d",
      },
      {
        kind: "feature",
        area: "Watch Party",
        title: "Add Watch Party interface",
        detail:
          "Introduces the Watch Party page component, with associated player, participant, chat, queue, room-details, and synchronization UI components added in separate commits.",
        commit: "9341abf",
      },
      {
        kind: "feature",
        area: "Watch Party",
        title: "Add Watch Party room presence hook",
        detail: "Adds a hook for managing presence in Watch Party rooms.",
        commit: "c09c1d0",
      },
      {
        kind: "feature",
        area: "Watch Party",
        title: "Add synchronized Watch Party playback hook",
        detail: "Adds a hook for coordinating Watch Party playback synchronization.",
        commit: "f8eb87c",
      },
      {
        kind: "feature",
        area: "Watch Party",
        title: "Add Watch Party API",
        detail: "Adds API operations for Watch Party functionality.",
        commit: "fb7f3f7",
      },
      {
        kind: "security",
        area: "Watch Party",
        title: "Add Watch Party security migration",
        detail: "Adds a database migration for Watch Party security configuration.",
        commit: "cfe8855",
      },
      {
        kind: "improvement",
        area: "JEE Predictor navigation",
        title: "Expose Weekly Study Review in feature menu",
        detail:
          "Adds a Weekly Study Review option to the feature slide menu, linking users to the review tool.",
        commit: "fc1c0c5",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add Weekly Study Review",
        detail:
          "Adds an authenticated route for a weekly study review tool in the JEE Predictor area.",
        commit: "a417567",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add Daily Targets study tool",
        detail: "Adds an authenticated JEE Predictor route for daily study targets.",
        commit: "86c8556",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add Question Review Queue",
        detail:
          "Adds an authenticated route for a question review queue in the JEE Predictor area.",
        commit: "2531240",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add exam countdown and milestones",
        detail: "Adds an authenticated JEE Predictor route for an exam countdown and milestones.",
        commit: "1f54595",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add mock test comparison",
        detail: "Adds an authenticated route for comparing mock tests.",
        commit: "f1e526b",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add study goals and targets",
        detail: "Adds an authenticated JEE Predictor route for study goals and targets.",
        commit: "93f4c19",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add performance trends",
        detail: "Adds an authenticated JEE Predictor route for viewing study performance trends.",
        commit: "5021cef",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add weak chapter detector",
        detail: "Adds an authenticated JEE Predictor route for identifying weak chapters.",
        commit: "add5692",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add mock test analysis",
        detail: "Adds an authenticated route for analyzing mock tests.",
        commit: "b0584be",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add DPP tracker",
        detail: "Adds an authenticated route for tracking daily practice problems.",
        commit: "f42d3e3",
      },
      {
        kind: "feature",
        area: "Study tools",
        title: "Add lecture tracker",
        detail: "Adds an authenticated route for tracking lectures.",
        commit: "6dab1f6",
      },
      {
        kind: "improvement",
        area: "JEE Predictor navigation",
        title: "Add JEE Predictor links to feature menu",
        detail:
          "Adds navigation entries for JEE prediction, admission, and preparation tools to the feature slide menu.",
        commit: "ed4ce20",
      },
    ],
  },
  {
    date: "2026-10-01",
    items: [
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add concept-map page",
        detail: "Adds a concept-map route to the JEE predictor.",
        commit: "7e7802b",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add heatmap page",
        detail: "Adds a heatmap route to the JEE predictor.",
        commit: "15b7c5b",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add study-now page",
        detail: "Adds a JEE predictor page for immediate study actions.",
        commit: "4b5568a",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add smart-revision page",
        detail: "Adds a JEE predictor smart-revision route.",
        commit: "da27b14",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add backlog-management page",
        detail: "Adds a JEE predictor route for backlog management.",
        commit: "7b283da",
      },
      {
        kind: "feature",
        area: "Study planner",
        title: "Build the JEE Predictor study planner",
        detail:
          "Added the planner’s full interface and behavior, including loading/error states and study-plan content.",
        commit: "53266c3",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add study-planner page",
        detail: "Adds a study-planner route to the JEE predictor.",
        commit: "02a7989",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add revision page",
        detail: "Adds a JEE predictor revision route.",
        commit: "eab78a3",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add previous-year questions page",
        detail: "Adds a page for previous-year questions in the JEE predictor.",
        commit: "fb58131",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add daily-practice page",
        detail: "Adds a JEE predictor daily-practice route.",
        commit: "d5fda03",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add mistake-book page",
        detail: "Adds a JEE predictor page for a mistake book.",
        commit: "04012e6",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add syllabus page",
        detail: "Adds a JEE predictor syllabus route.",
        commit: "fdf3ed5",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add programs page",
        detail: "Adds a JEE predictor route for browsing programs.",
        commit: "df96d78",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add scholarship eligibility checker",
        detail: "Adds a route for checking scholarship eligibility.",
        commit: "32a7c0a",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add scholarship listings",
        detail: "Adds a JEE predictor page for scholarships.",
        commit: "bea8928",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add 360-degree comparison page",
        detail: "Adds a JEE predictor page for broader college comparisons.",
        commit: "6e921d7",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add living-costs page",
        detail: "Adds a predictor page for exploring living costs.",
        commit: "9e4fafe",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add campus information page",
        detail: "Adds a route for campus information in the JEE predictor.",
        commit: "9de0a2d",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add return-on-investment page",
        detail: "Adds a JEE predictor page for return-on-investment comparisons.",
        commit: "aede4ce",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add placement information page",
        detail: "Adds a JEE predictor route for placement information.",
        commit: "779ad1a",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add fee information page",
        detail: "Adds a JEE predictor route for college fee information.",
        commit: "571b408",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add document checklist page",
        detail: "Adds a JEE predictor page for admission-document information.",
        commit: "2f1f59f",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add counselling checklist page",
        detail: "Adds a JEE counselling checklist route.",
        commit: "fc11b09",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add preference optimizer page",
        detail: "Adds a JEE predictor preference-optimization interface.",
        commit: "1afc994",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add college recommendations page",
        detail: "Adds a JEE predictor route for presenting college recommendations.",
        commit: "5c9edee",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add branch-demand page",
        detail: "Adds a JEE predictor page for branch-demand information.",
        commit: "efc856e",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add rank-trends page",
        detail: "Adds a route for viewing JEE rank trends.",
        commit: "051fd94",
      },
      {
        kind: "feature",
        area: "JEE Predictor",
        title: "Add the admission-fit explorer",
        detail:
          "Added an admission-fit route for exploring institution options against a student’s profile.",
        commit: "2d954f2",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add admission-fit page",
        detail: "Adds a JEE predictor route for exploring admission fit.",
        commit: "a14a079",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add institute directory",
        detail: "Adds an institute directory route to the JEE predictor.",
        commit: "fa61b30",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add seat-matrix page",
        detail: "Adds a JEE predictor page for exploring seat-matrix information.",
        commit: "30ba25e",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add choice-filling page",
        detail: "Adds a JEE predictor interface for choice filling.",
        commit: "196b836",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add JEE preference page",
        detail: "Adds a predictor page for configuring user preferences.",
        commit: "1387674",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add shortlist save control",
        detail: "Adds a reusable button component for saving a college to the shortlist.",
        commit: "088db7c",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add college shortlist page",
        detail: "Adds a page for viewing shortlisted colleges in the JEE predictor.",
        commit: "f2fc0aa",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add rank-range explorer",
        detail: "Adds a JEE predictor page for exploring rank ranges.",
        commit: "0d54a5a",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add marks-to-rank view",
        detail: "Adds a JEE predictor page for relating exam marks to rank.",
        commit: "78fcfff",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add marks-to-percentile view",
        detail: "Adds a JEE predictor page for relating exam marks to percentile.",
        commit: "fb48053",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add cutoff tracker",
        detail: "Adds a cutoff-tracking route to the JEE predictor.",
        commit: "ef2545a",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add cutoff explorer",
        detail: "Adds a page for browsing JEE admission cutoffs.",
        commit: "74daaf1",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add college comparison tool",
        detail: "Adds a JEE predictor comparison page for comparing colleges.",
        commit: "4050a3c",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add NIT, IIIT and GFTI listings",
        detail: "Adds a predictor page for browsing NIT, IIIT and GFTI institutions.",
        commit: "b8b3af0",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add branch exploration page",
        detail: "Adds a JEE predictor route for exploring branches.",
        commit: "d4077e1",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add advanced predictor page",
        detail: "Adds an advanced JEE predictor route and its interface.",
        commit: "4371db0",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add college discovery page",
        detail: "Adds a college route for exploring institute information in the JEE predictor.",
        commit: "57b2593",
      },
      {
        kind: "feature",
        area: "JEE predictor",
        title: "Add JEE predictor entry page",
        detail: "Adds an authenticated JEE predictor page with navigation to predictor tools.",
        commit: "eb1f083",
      },
      {
        kind: "improvement",
        area: "NTA Sync",
        title: "Add NTA synchronization to admin navigation",
        detail: "Added an NTA Sync entry to the admin section of the feature menu.",
        commit: "8df2df7",
      },
      {
        kind: "improvement",
        area: "NTA JEE Main",
        title: "Add NTA JEE Main to feature navigation",
        detail: "Added an NTA JEE Main entry to the study section of the feature menu.",
        commit: "3036123",
      },
      {
        kind: "feature",
        area: "NTA/JEE hub",
        title: "Add NTA admin route",
        detail: "Adds the authenticated admin route for the NTA synchronization page.",
        commit: "e1d620c",
      },
      {
        kind: "feature",
        area: "NTA/JEE hub",
        title: "Add NTA sync administration page",
        detail: "Adds an admin page component for NTA synchronization operations.",
        commit: "de10a46",
      },
      {
        kind: "feature",
        area: "NTA/JEE hub",
        title: "Add authenticated NTA route",
        detail: "Adds the authenticated route that exposes the NTA Hub page.",
        commit: "d638249",
      },
      {
        kind: "feature",
        area: "NTA/JEE hub",
        title: "Add NTA Hub page",
        detail: "Adds the NTA Hub page component for presenting NTA-related content and actions.",
        commit: "822191f",
      },
      {
        kind: "feature",
        area: "NTA/JEE hub",
        title: "Add NTA data helpers",
        detail: "Adds a library for NTA/JEE-related data access and helper operations.",
        commit: "7eac4eb",
      },
      {
        kind: "feature",
        area: "NTA/JEE hub",
        title: "Add NTA and JEE hub database schema",
        detail: "Adds a migration defining database structures for the NTA/JEE hub features.",
        commit: "bb32cb7",
      },
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Add achievement summaries to the dashboard",
        detail:
          "Added an Achievements section with cards for rank, study time, and learning milestones.",
        commit: "d1d5b06",
      },
      {
        kind: "improvement",
        area: "Dashboard / Squads",
        title: "Add joined squads to the dashboard workspace",
        detail:
          "Added squad workspace data and group/unread-message summaries to the dashboard workspace.",
        commit: "2b67a8b",
      },
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Expand dashboard workspace",
        detail:
          "Adds dashboard workspace sections and interaction logic, substantially extending the dashboard component.",
        commit: "074632f",
      },
      {
        kind: "improvement",
        area: "Dashboard",
        title: "Build dashboard page around workspace",
        detail:
          "Adds dashboard workspace functionality to the dashboard route, with substantial new dashboard content and controls.",
        commit: "ff5385c",
      },
      {
        kind: "feature",
        area: "Dashboard",
        title: "Add dashboard workspace",
        detail:
          "Adds a dashboard workspace component with panels and actions for the authenticated dashboard.",
        commit: "df0206c",
      },
      {
        kind: "improvement",
        area: "Squads",
        title: "Refactor squad group information and member display",
        detail:
          "Reworks the squad group-information dialog and member display, adding a substantially revised group details and member-management interface.",
        commit: "f94b3d0",
      },
      {
        kind: "improvement",
        area: "Admin email",
        title: "Expand admin email operations",
        detail:
          "Updates the admin email interface with substantial changes to its controls and workflow for Gmail-backed email operations.",
        commit: "4a42187",
      },
      {
        kind: "feature",
        area: "Gmail integration",
        title: "Add Gmail email-sending endpoint",
        detail: "Adds an API route for sending mail through the Gmail integration.",
        commit: "abba884",
      },
      {
        kind: "feature",
        area: "Gmail integration",
        title: "Add Gmail OAuth callback endpoint",
        detail:
          "Adds an API callback route to process Gmail authorization responses and connection state.",
        commit: "c0c1ff6",
      },
      {
        kind: "feature",
        area: "Gmail integration",
        title: "Add Gmail account connection endpoint",
        detail: "Adds an API endpoint to initiate a Gmail OAuth connection flow.",
        commit: "6271e36",
      },
      {
        kind: "security",
        area: "Gmail integration",
        title: "Add Gmail token encryption helpers",
        detail:
          "Adds cryptographic helper functions used to protect Gmail integration credentials.",
        commit: "460cefb",
      },
      {
        kind: "feature",
        area: "Gmail integration",
        title: "Add Gmail integration storage",
        detail:
          "Adds a database migration for Gmail integration records and supporting persistence fields.",
        commit: "76c278a",
      },
      {
        kind: "feature",
        area: "Admin email",
        title: "Add admin email workspace",
        detail: "Adds an admin email route and interface for managing email-related operations.",
        commit: "6b69bda",
      },
      {
        kind: "improvement",
        area: "Admin",
        title: "Link verification management in Admin Center",
        detail: "Adds account verification to the Admin Center navigation.",
        commit: "ddaf720",
      },
      {
        kind: "feature",
        area: "Admin",
        title: "Add verification administration page",
        detail:
          "Adds an admin verification route and page for reviewing and managing account-verification information.",
        commit: "6c4650e",
      },
      {
        kind: "security",
        area: "Authentication",
        title: "Add signup account-verification flow",
        detail:
          "Updates the auth route with account verification-related signup and sign-in handling, including verification messaging and related state transitions.",
        commit: "cfc6d0c",
      },
      {
        kind: "feature",
        area: "Authentication",
        title: "Add account verification page",
        detail:
          "Adds an authenticated verification page component with verification status and user-facing actions for completing or refreshing verification.",
        commit: "5edbcf6",
      },
      {
        kind: "security",
        area: "Authentication",
        title: "Gate authenticated routes on account verification",
        detail:
          "Adds an AccountVerificationGate in the authenticated route flow, querying verification status and rendering a verification-required state instead of protected route content when required.",
        commit: "23cac37",
      },
      {
        kind: "improvement",
        area: "Streak popup",
        title: "Add resilient streak-popup loading",
        detail:
          "Introduces a useStreakPopup hook that requests popup data, retries failed calls with increasing delays, checks abort state before updating, and logs caught errors.",
        commit: "9bf3a8f",
      },
    ],
  },
  {
    date: "2026-09-30",
    items: [
      {
        kind: "security",
        area: "Security reporting",
        title: "Add vulnerability-reporting security.txt",
        detail:
          "Adds .well-known/security.txt with the canonical URL, contact page, expiry date, and preferred language for vulnerability reporting.",
        commit: "095fb30",
      },
      {
        kind: "security",
        area: "HTTP security headers",
        title: "Tighten production script policy",
        detail:
          "Changes script-src and script-src-elem to allow only self, inline scripts, and explicit Cloudflare Turnstile and YouTube origins in production; development keeps preview-specific origins and unsafe-eval.",
        commit: "6ede0a1",
      },
      {
        kind: "security",
        area: "HTTP security headers",
        title: "Restrict production framing",
        detail:
          "Adds production-host detection and sets X-Frame-Options to SAMEORIGIN on production responses. The CSP frame-ancestors policy is also split so Lovable preview framing remains available outside production.",
        commit: "3700443",
      },
      {
        kind: "fix",
        area: "Admin consent settings",
        title: "Fix consent-settings success toast placement",
        detail:
          "Moves the success toast invocation in the consent-settings route so it is placed with the save-success handling.",
        commit: "b76d23e",
      },
      {
        kind: "improvement",
        area: "Admin consents",
        title: "Expand consent administration settings",
        detail:
          "Substantially revised the admin consent-settings route with additional settings UI and workflow handling.",
        commit: "c33631b",
      },
      {
        kind: "feature",
        area: "Maintenance mode",
        title: "Integrate maintenance handling at the app root",
        detail:
          "Updates the root route to include the maintenance-mode handling used to gate the application.",
        commit: "664788e",
      },
      {
        kind: "improvement",
        area: "Maintenance mode",
        title: "Improve maintenance page messaging",
        detail:
          "Revises the maintenance page layout and copy, including its temporary-unavailability status and explanatory text.",
        commit: "b890f9d",
      },
      {
        kind: "feature",
        area: "Maintenance mode",
        title: "Add maintenance access guard",
        detail: "Adds MaintenanceGuard to gate application access based on maintenance mode.",
        commit: "d3caec2",
      },
      {
        kind: "feature",
        area: "Maintenance mode",
        title: "Add maintenance-mode state hook",
        detail: "Adds useMaintenanceMode to provide a hook for reading maintenance-mode state.",
        commit: "258f925",
      },
      {
        kind: "feature",
        area: "Maintenance mode",
        title: "Add maintenance-mode page",
        detail:
          "Creates a dedicated MaintenancePage with an offline status, maintenance notice, and account/study-data reassurance.",
        commit: "46d48d0",
      },
      {
        kind: "feature",
        area: "Admin consent settings",
        title: "Add admin control for skipped-consent banner",
        detail:
          "Adds show_consent_skipped_banner to consent settings state and presents an admin toggle for controlling whether the verification-skipped banner is shown.",
        commit: "8a549b3",
      },
      {
        kind: "improvement",
        area: "Consent verification",
        title: "Gate skipped-consent banner with a setting",
        detail:
          "Loads show_consent_skipped_banner alongside consent_enabled and hides the banner unless the new flag is true, consent is disabled, and a user is authenticated.",
        commit: "da81f80",
      },
      {
        kind: "feature",
        area: "Leaderboard",
        title: "Complete leaderboard and Pro reward UI",
        detail:
          "Updates the leaderboard route with leaderboard functionality and adds corresponding RPC migrations and Supabase types; the route describes the weekly winner reward as seven days of Pro.",
        commit: "d0b4b66",
      },
      {
        kind: "feature",
        area: "Leaderboard",
        title: "Add weekly leaderboard view",
        detail: "Adds the leaderboard route UI for displaying weekly study-time rankings.",
        commit: "d3b7232",
      },
      {
        kind: "feature",
        area: "Leaderboard",
        title: "Add weekly winner finalization and leaderboard context",
        detail:
          "Adds an authenticated server function that calls finalize_weekly_winners, and updates the leaderboard with the logged-in user's position, gap to the leader, India-time week labeling, and a week countdown.",
        commit: "54098b4",
      },
      {
        kind: "feature",
        area: "Leaderboard data",
        title: "Add leaderboard migration",
        detail: "Adds a migration file for the leaderboard database changes.",
        commit: "f5abe8a",
      },
      {
        kind: "feature",
        area: "Leaderboard data",
        title: "Add leaderboard database support",
        detail:
          "Adds database migration and generated Supabase types supporting the leaderboard data and RPC functionality.",
        commit: "c8d49c0",
      },
      {
        kind: "fix",
        area: "Profile and study content",
        title: "Fix profile-page build errors",
        detail:
          "Adjusts profile and related study-content components and route code, alongside dependency and generated route/type updates, to address profile-page build errors.",
        commit: "be80abc",
      },
      {
        kind: "security",
        area: "Admin consent data",
        title: "Use decrypted-consent RPC in admin view",
        detail:
          "Replaces direct selection from user_consents with the admin_get_consents_decrypted RPC when loading consent records in the admin consents route.",
        commit: "9fd0be8",
      },
    ],
  },
  {
    date: "2026-09-29",
    items: [
      {
        kind: "feature",
        area: "Messaging",
        title: "Replace message inbox with combined Squad view",
        detail:
          "Reworks the inbox into a Squad view with tabs for all conversations, direct messages, groups, and requests. Loads joined groups, recent messages, sender details, unread counts, and DM profiles for the new conversation list.",
        commit: "eeb4871",
      },
      {
        kind: "improvement",
        area: "Study notes",
        title: "Improve study-notes reader",
        detail:
          "Updates the NotesReader component used to open study resources; this is a separate reader change from the new markdown rendering component added in the next commit.",
        commit: "4947f7e",
      },
      {
        kind: "feature",
        area: "Study notes",
        title: "Add markdown rendering for study content",
        detail:
          "Adds StudyMarkdown.tsx to render study material written in Markdown, including formatted content for notes and other study resources.",
        commit: "f4c4d64",
      },
      {
        kind: "improvement",
        area: "Pulse",
        title: "Update pulse server function",
        detail:
          "Changes the pulse server function implementation. The commit modifies application pulse behavior in the server function rather than generated files.",
        commit: "01eaa65",
      },
      {
        kind: "improvement",
        area: "Dashboard / study streak",
        title: "Update dashboard streak experience",
        detail:
          "Changes the dashboard integration for the study-streak experience. The dashboard update is a separate step from the streak button component and the earlier dashboard commit.",
        commit: "506b896",
      },
      {
        kind: "feature",
        area: "Dashboard / study streak",
        title: "Add study streak to dashboard",
        detail:
          "Updates the dashboard to present the study-streak feature, connecting the new streak UI to the dashboard.",
        commit: "32a176b",
      },
      {
        kind: "feature",
        area: "Study streak",
        title: "Add study streak recording button",
        detail:
          "Adds a dashboard component that records a study day through the study-streak function, reports success or failure, and shows the current streak state.",
        commit: "357008e",
      },
      {
        kind: "security",
        area: "Tests",
        title: "Validate test question ownership before saving responses",
        detail:
          "Checks that the submitted question belongs to the test associated with the user's attempt before upserting a response, rejecting mismatched question IDs.",
        commit: "3a03207",
      },
      {
        kind: "security",
        area: "Profile posts",
        title: "Shorten profile-post image URL lifetime",
        detail:
          "Reduces signed profile-post storage URLs from seven days to one hour, shortening the period during which a generated URL remains usable.",
        commit: "2316b10",
      },
      {
        kind: "improvement",
        area: "Profile posts",
        title: "Fetch profile-post comments through RPC",
        detail:
          "Replaces direct comment and profile-table reads with the get_profile_post_comments RPC and maps the returned comment and profile fields for display.",
        commit: "651a23f",
      },
      {
        kind: "improvement",
        area: "Profile posts",
        title: "Fetch profile-post like count and current-user state separately",
        detail:
          "Changes likes loading to request an exact count and the signed-in user's like separately, and includes the user ID in the query key.",
        commit: "16613de",
      },
      {
        kind: "security",
        area: "Admin / audit logs",
        title: "Enforce permission for audit-log access",
        detail:
          "Adds a server-side users-permission check before the admin audit-log listing function returns audit data.",
        commit: "a07e248",
      },
      {
        kind: "security",
        area: "Admin",
        title: "Require users permission for admin center",
        detail:
          "Adds a route guard that requires the users permission before loading the admin center.",
        commit: "3829518",
      },
      {
        kind: "security",
        area: "Admin / videos",
        title: "Restrict video administration to full admins",
        detail: "Adds a full-admin route guard to the admin videos page.",
        commit: "5dccfaa",
      },
      {
        kind: "security",
        area: "Admin / tests",
        title: "Restrict test administration to full admins",
        detail: "Adds a full-admin route guard to the admin tests page.",
        commit: "d28388a",
      },
      {
        kind: "security",
        area: "Admin / test approvals",
        title: "Restrict test approvals to full admins",
        detail: "Adds a full-admin route guard to the test approvals page.",
        commit: "dd2efa9",
      },
      {
        kind: "security",
        area: "Admin / consent settings",
        title: "Restrict consent settings to full admins",
        detail: "Adds a full-admin route guard to the consent-settings page.",
        commit: "257de72",
      },
      {
        kind: "security",
        area: "Admin / consents",
        title: "Require consents permission for consent administration",
        detail: "Adds a consents-permission route guard to the admin consents page.",
        commit: "3ee48fb",
      },
      {
        kind: "security",
        area: "Admin / contact",
        title: "Require contact permission for contact inbox",
        detail: "Adds a contact-permission route guard to the admin contact inbox.",
        commit: "c7695d6",
      },
      {
        kind: "security",
        area: "Admin / appeals",
        title: "Require appeals permission for appeals administration",
        detail: "Adds an appeals-permission route guard to the admin appeals page.",
        commit: "1617d6a",
      },
      {
        kind: "improvement",
        area: "Quiz progress",
        title: "Persist quiz statistics in Supabase",
        detail:
          "Replaces browser-local quiz-stat persistence with user-scoped Supabase reads and writes for XP, level, streak, best scores, and quiz counters; daily streak dates are calculated in Asia/Kolkata.",
        commit: "fb65941",
      },
      {
        kind: "feature",
        area: "User state",
        title: "Add shared user-state helpers",
        detail: "Adds a userState utility module for application user-state operations.",
        commit: "9fda348",
      },
      {
        kind: "feature",
        area: "Navigation / study streak",
        title: "Expose study streak in feature menu",
        detail: "Adds the study-streak feature to the features slide menu.",
        commit: "17c1ab7",
      },
      {
        kind: "feature",
        area: "Study streak",
        title: "Add daily streak popup",
        detail: "Adds a DailyStreakPopup component for the daily study-streak prompt.",
        commit: "468b724",
      },
      {
        kind: "feature",
        area: "Admin / study notes",
        title: "Add admin study-notes management page",
        detail: "Adds an admin notes route with controls for managing study-note material.",
        commit: "66eae9b",
      },
      {
        kind: "feature",
        area: "Study notes",
        title: "Add study chapter reader route",
        detail:
          "Adds a chapter route that presents chapter resources, tracks viewed resource types, and lets users favourite or mark a chapter complete.",
        commit: "0b7bc74",
      },
      {
        kind: "feature",
        area: "Study notes",
        title: "Add chapter listing and progress filters",
        detail:
          "Adds class-and-subject chapter listings with search and filters for favourites, pending, and completed chapters, alongside progress and resource availability indicators.",
        commit: "d7af9be",
      },
      {
        kind: "feature",
        area: "Study notes",
        title: "Add study-notes landing page",
        detail: "Adds the notes landing route for browsing study notes by class and subject.",
        commit: "81c9404",
      },
      {
        kind: "feature",
        area: "Study notes",
        title: "Add study resource reader component",
        detail: "Adds the NotesReader component used to display study resources.",
        commit: "23a2656",
      },
      {
        kind: "feature",
        area: "Study notes",
        title: "Add study-notes data and progress helpers",
        detail:
          "Adds notes utilities for retrieving chapters and study resources and handling chapter progress data.",
        commit: "417b043",
      },
      {
        kind: "improvement",
        area: "Study streak",
        title: "Connect daily streak popup to authenticated route",
        detail: "Updates the authenticated route to include the DailyStreakPopup component.",
        commit: "a18b4dc",
      },
      {
        kind: "feature",
        area: "Study streak",
        title: "Add daily streak popup component",
        detail:
          "Adds the DailyStreakPopup component at the app source path, providing the streak-popup UI.",
        commit: "5400261",
      },
      {
        kind: "design",
        area: "Promotional popup",
        title: "Revise promotional popup",
        detail:
          "Reworks the PromoPopup component's content and presentation, changing its layout and behavior in the popup.",
        commit: "1f04b38",
      },
      {
        kind: "fix",
        area: "Messaging",
        title: "Adjust direct-message reply handling",
        detail: "Changes direct-message reply handling in the peer conversation route.",
        commit: "6a7d00f",
      },
      {
        kind: "improvement",
        area: "Messaging",
        title: "Update direct-message conversation view",
        detail:
          "Makes a separate one-line change to the direct-message peer route affecting its conversation view.",
        commit: "bde8cca",
      },
      {
        kind: "design",
        area: "Messaging",
        title: "Adjust shared chat styling",
        detail: "Updates chat-related CSS styling in the shared stylesheet.",
        commit: "6f80bfd",
      },
      {
        kind: "fix",
        area: "Messaging",
        title: "Fix chat layout and old replies",
        detail:
          "Changes the peer-message route to correct chat layout and handling of older replies.",
        commit: "8f55dd1",
      },
      {
        kind: "feature",
        area: "Messaging",
        title: "Add direct-message reply redesign support",
        detail:
          "Adds a database migration and generated Supabase types for direct-message reply support.",
        commit: "a06417e",
      },
    ],
  },
  {
    date: "2026-09-28",
    items: [
      {
        kind: "improvement",
        area: "Direct messaging",
        title: "Add linked replies and refresh private messaging UI",
        detail:
          "Messages can be stored with a reply_to_id and display the referenced message, sender and read status in the thread. The commit also restyles the inbox and thread with responsive glass-like surfaces, online status, updated typography and reduced-motion handling.",
        commit: "bed6970",
      },
      {
        kind: "feature",
        area: "Direct messaging data model",
        title: "Add validated message-reply references",
        detail:
          "Adds nullable reply_to_id to direct_messages, an index, and a trigger that rejects reply targets outside the same conversation; generated Supabase types describe the new field and relationship.",
        commit: "69c4d74",
      },
    ],
  },
  {
    date: "2026-09-27",
    items: [
      {
        kind: "improvement",
        area: "Test Series",
        title: "Rework the test attempt interface",
        detail:
          "Replaced and expanded the attempt route UI with updated question navigation and answer-entry flows.",
        commit: "2defc10",
      },
      {
        kind: "design",
        area: "Global appearance",
        title: "Add global palette styling and initialization",
        detail:
          "Adds forest and coral palette CSS variables and theme rules, and initializes the saved palette from local storage in the root document. The commit also documents keeping feed UI in `NewCommunityFeed` while data mutations remain shared.",
        commit: "891bf1c",
      },
      {
        kind: "improvement",
        area: "Community feed and appearance",
        title: "Switch feed route to new community UI",
        detail:
          "Replaces the large feed-route implementation with `NewCommunityFeed` and adds `BackgroundSettings` plus a color-palette utility. The route also updates its canonical and Open Graph URL to the `.co.in` site.",
        commit: "f8ab68a",
      },
      {
        kind: "feature",
        area: "Community feed",
        title: "Add redesigned community feed component",
        detail:
          "Introduces `NewCommunityFeed.tsx` with a replacement community-feed interface and its feed interaction elements. The component is subsequently wired into the feed route in a later commit.",
        commit: "cb69b98",
      },
    ],
  },
  {
    date: "2026-09-26",
    items: [
      {
        kind: "improvement",
        area: "Authentication; Supabase types",
        title: "Synchronize preview auth storage and Supabase types",
        detail:
          "Preview-auth storage now reconciles a successful broker response into localStorage only if the stored value still matches the value just written, removing the key for an empty response. Generated Supabase types add streak-popup and test-result-DM fields and declarations for related RPCs.",
        commit: "0112cac",
      },
    ],
  },
  {
    date: "2026-09-25",
    items: [
      {
        kind: "improvement",
        area: "Promo popup",
        title: "Change promo popup display timing",
        detail:
          "The promo popup now opens shortly after each page load, reappears at randomized intervals of three to eight minutes after dismissal, and opens on sign-in. This replaces the prior one-time local-storage dismissal behavior.",
        commit: "b2b4471",
      },
      {
        kind: "feature",
        area: "Dashboard / streaks",
        title: "Show the streak popup on the dashboard",
        detail:
          "Imported `useStreakPopup` and `StreakPopup` into the authenticated dashboard, wiring streak-popup behavior into the dashboard route.",
        commit: "e6636c5",
      },
      {
        kind: "improvement",
        area: "Community feed",
        title: "Rework the community feed around live posts",
        detail:
          "Replaced the `UltimateCommunityFeed` component with feed functionality in the `/feed` route, including live posts, stories, post creation, comments, votes, attachments, and feed search. The change also restores database-backed content in place of the prior component implementation.",
        commit: "b16a6c6",
      },
      {
        kind: "feature",
        area: "Feedback Hub",
        title: "Add Feedback Hub navigation links",
        detail:
          "Added Feedback Hub and Feedback Console entries to the feature menu, linking to `/feedback` and `/admin/feedback`. The roadmap marks the Feedback Hub integration complete; the commit diff itself contains the navigation and roadmap changes.",
        commit: "ecb8b7f",
      },
    ],
  },
  {
    date: "2026-09-24",
    items: [
      {
        kind: "feature",
        area: "Feedback hub / UI",
        title: "Build feedback hub and admin console",
        detail:
          "Adds a public hub with topper forms, community wall, feedback and material-request submissions, user status tracking, and basic hub analytics. Adds an admin console for reviewing and updating submissions, managing forms, and moderating wall posts.",
        commit: "33517c9",
      },
      {
        kind: "feature",
        area: "Feedback hub / server functions",
        title: "Add validated feedback server actions",
        detail:
          "Adds authenticated server functions for submitting feedback and material requests, posting and liking wall messages, and admin moderation and form management. Inputs are Zod-validated; submission and wall posting use honeypot and rate-limit checks, while admin actions check the admin role.",
        commit: "3ff723d",
      },
      {
        kind: "feature",
        area: "Feedback hub / database",
        title: "Add feedback hub data schema",
        detail:
          "Adds Supabase tables for user feedback and material requests, community-wall posts and likes, and active feedback forms, with length/type constraints, indexes, triggers, and row-level access policies. Updates generated database types for the new tables.",
        commit: "c6acd1e",
      },
    ],
  },
  {
    date: "2026-09-23",
    items: [
      {
        kind: "design",
        area: "Features menu",
        title: "Update feature slide menu",
        detail:
          "Updates the FeaturesSlideMenu component; the commit diff changes menu content and presentation for the feature slides.",
        commit: "6f2c284",
      },
      {
        kind: "improvement",
        area: "Admin / Study Materials access",
        title: "Add trusted-user materials access controls",
        detail:
          "Adds server-side functions to list and grant or revoke trusted Study Materials access, plus an admin-users table toggle and indicator for that access.",
        commit: "9742485",
      },
      {
        kind: "security",
        area: "Database / Study Materials access",
        title: "Add trusted Study Materials access registry",
        detail:
          "Creates a material_trusted_users table with admin-only row-level security policies for viewing, granting, and revoking trusted access, and adds its generated Supabase types.",
        commit: "f267bb4",
      },
      {
        kind: "improvement",
        area: "Database / Study Materials search",
        title: "Add trigram search indexes for materials",
        detail:
          "Adds separate GIN trigram indexes on materials title, description, and topic, and updates the generated Supabase database types with the trusted_unlock_codes table.",
        commit: "234d180",
      },
    ],
  },
  {
    date: "2026-09-22",
    items: [
      {
        kind: "feature",
        area: "Study Materials access",
        title: "Allow trusted permanent materials unlock codes",
        detail:
          "Materials unlock now checks the primary gate password first, then compares the submitted password against hashes in `trusted_unlock_codes`. The code comments describe these as continuing to work across primary-password rotations.",
        commit: "8fe6567",
      },
      {
        kind: "improvement",
        area: "Study Materials",
        title: "Add server-side materials filtering and pagination",
        detail:
          "Replaces filtering over the initially loaded materials with validated server-side subject, class, and search filters, exact counts, and bounded pages. The materials page uses infinite-query pages and offers a load-more control.",
        commit: "b01f200",
      },
      {
        kind: "improvement",
        area: "Study Materials database",
        title: "Move pg_trgm into the extensions schema",
        detail:
          "Adds a migration to set the `pg_trgm` extension schema to `extensions` and removes its two function declarations from generated Supabase types.",
        commit: "820d3ce",
      },
      {
        kind: "improvement",
        area: "Study Materials database",
        title: "Add indexes for materials listing and search",
        detail:
          "Adds `pg_trgm` and indexes to support materials ordering, subject/class filtering, and trigram-based searches over title, description, and topic. Also updates generated Supabase function type declarations for the extension.",
        commit: "2671f67",
      },
    ],
  },
  {
    date: "2026-09-21",
    items: [
      {
        kind: "security",
        area: "Supabase RLS and storage",
        title: "Add scoped read policies for certificates and media",
        detail:
          "Adds policies for certificate types, polls, toppers, avatars and chat media, including checks for account status, ownership, deletion state and whether referenced content remains in use.",
        commit: "6f559a2",
      },
      {
        kind: "security",
        area: "Supabase RLS and server actions",
        title: "Tighten access to social and community data",
        detail:
          "Adds row-level policies that condition reads across chat, posts, feed, forum, video, social graph, group settings and storage by author status, ownership, membership, or referencing rows. The merge also includes safeguards for AI chat requests and doubt answers.",
        commit: "5855dee",
      },
      {
        kind: "security",
        area: "AI chat server action",
        title: "Validate AI chat endpoints and conversation history",
        detail:
          "Restricts custom AI endpoints to public HTTPS hostnames and rejects credentials, ports, local names and IP literals. Limits forwarded history to 40 messages, accepts only user/assistant roles, and requires the last message to be from the user.",
        commit: "983a537",
      },
      {
        kind: "security",
        area: "Community chat server action",
        title: "Limit Ask AI to accessible, active doubts",
        detail:
          "Adds per-user rate limiting and reads doubts through the caller's Supabase client so row policies apply. It rejects AI-generated or deleted doubts before answering.",
        commit: "3929214",
      },
      {
        kind: "improvement",
        area: "Homepage metadata",
        title: "Update homepage sharing metadata",
        detail:
          "Removes the year from the homepage title and Open Graph title, and adds an Open Graph site name for JEE Prep Hub.",
        commit: "16965cb",
      },
      {
        kind: "improvement",
        area: "Root page metadata",
        title: "Refresh site metadata and icon references",
        detail:
          "Updates the root document title and social metadata to use the JEE Prep Hub name, adds application and Apple web-app titles, and switches favicon references to PNG with an Apple touch icon.",
        commit: "14a1628",
      },
      {
        kind: "improvement",
        area: "SEO configuration",
        title: "Use an absolute sitemap URL",
        detail:
          "Adds the site host to robots.txt and changes its sitemap directive from a relative path to the full jeeprephub.co.in URL.",
        commit: "afc9698",
      },
    ],
  },
  {
    date: "2026-09-20",
    items: [
      {
        kind: "feature",
        area: "Global UI",
        title: "Show the community promo popup site-wide",
        detail:
          "Imports and renders `PromoPopup` from the root route component, making the promotional dialog available across nested routes.",
        commit: "9027e8d",
      },
      {
        kind: "feature",
        area: "Community promotion",
        title: "Add WhatsApp community promo dialog",
        detail:
          "Adds a dismissible popup promoting the JEE Prep Hub WhatsApp community. It waits 800 ms before opening and stores dismissal in local storage.",
        commit: "00536f0",
      },
      {
        kind: "feature",
        area: "Chemistry resources",
        title: "Add JEE Advanced chemistry resource landing page",
        detail:
          "Adds a chemistry landing route and server-side data function that retrieves chemistry materials, classifies them by topic, and presents gated resources, PYQs, study guidance, FAQs, and links. Adds the route to the sitemap.",
        commit: "443b209",
      },
      {
        kind: "improvement",
        area: "SEO and social sharing",
        title: "Use branded large-image social previews",
        detail:
          "Updates root-page metadata to use a large-image Twitter card and the JEE Prep Hub image for Open Graph and Twitter previews, including image dimensions.",
        commit: "28f5015",
      },
      {
        kind: "design",
        area: "Social sharing",
        title: "Add social preview image asset",
        detail:
          "Adds `public/og-jeeprephub.png`, the image asset subsequently referenced for Open Graph and Twitter previews.",
        commit: "04262c7",
      },
      {
        kind: "security",
        area: "Database access control",
        title: "Restrict community AI settings reads to admins",
        detail:
          "Adds a database migration replacing the broad read policy with an authenticated-admin-only SELECT policy and revokes SELECT from the `anon` role.",
        commit: "52c9037",
      },
      {
        kind: "improvement",
        area: "Community AI settings",
        title: "Read AI chat settings through the server admin client",
        detail:
          "Changes the authenticated settings-read server function to use the server-side admin client and return only the AI doubt-answer flag and update timestamp, rather than reading through the user client.",
        commit: "3699af4",
      },
      {
        kind: "fix",
        area: "SEO and links",
        title: "Align site metadata and admin links with jeeprephub.co.in",
        detail:
          "Replaces the prior Lovable hostname with `jeeprephub.co.in` in canonical and Open Graph metadata, site URL constants, and the admin credential login link across routes.",
        commit: "7e70b52",
      },
    ],
  },
  {
    date: "2026-09-19",
    items: [
      {
        kind: "design",
        area: "Admin badge",
        title: "Label the developer account separately from admins",
        detail:
          "The badge component now displays “Developer” for the specified account ID and “Admin” for other accounts, while retaining the existing visual-only badge suppression behavior.",
        commit: "a813a7c",
      },
      {
        kind: "feature",
        area: "Pulse / Database",
        title: "Create a unified Pulse feed database view",
        detail:
          "Added the `pulse_feed_items` view to combine published video lectures and feed posts with author details and like/comment counts. Added an admin-role lookup function used to mark post authors who are admins, with execute privileges restricted from PUBLIC.",
        commit: "348ff73",
      },
    ],
  },
  {
    date: "2026-09-18",
    version: "v4.4",
    headline: "Policies hub, sign-up agreement & Pulse playback fix",
    items: [
      {
        kind: "feature",
        area: "Policies",
        title: "Full Policies & Community Rules hub at /legal",
        detail:
          "11 documents — About, Terms of Use, Community Guidelines, Academic Integrity & AI, Study Material & Copyright, Privacy, Children & Minor Safety, Educational Disclaimer, Cookies, Accessibility and Contact & Legal Notices — each with its own contents list and version details.",
      },
      {
        kind: "feature",
        area: "Sign up",
        title: "Terms of Use agreement on account creation",
        detail:
          "New members now confirm they accept the Terms of Use, Community Guidelines and Privacy Policy before the account is created, with the date of acceptance saved to their profile.",
      },
      {
        kind: "fix",
        area: "Pulse",
        title: "Lecture videos play again",
        detail: "The site's security rules were blocking the YouTube player script, so lectures never started. Fixed.",
      },
      {
        kind: "improvement",
        area: "Navigation",
        title: "About and every policy page listed separately in the side menu",
        detail: "A new 'About & Policies' section links each document directly, plus this Updates page.",
      },
      {
        kind: "security",
        area: "Privacy",
        title: "Tighter rules on chat messages, profile posts and profile uploads",
      },
    ],
  },
  {
    date: "2026-09-17",
    version: "v4.3",
    headline: "JEE 360 + Progress Tracker",
    items: [
      {
        kind: "feature",
        area: "JEE 360",
        title: "JEE 360 workspace at /jee360",
        detail:
          "Today, Schedule, Backlog, Tests, Lab (focus, memory, rank simulator, AI coach), Plans, Reminders and Import — saved in your own browser.",
      },
      {
        kind: "feature",
        area: "Progress",
        title: "Analytics Progress Tracker",
        detail: "Rating ring, Bronze-to-Diamond tier, weekly change, accuracy chips, subject cards and achievements.",
      },
      {
        kind: "feature",
        area: "Tests",
        title: "Branded PDF export of any test attempt",
        detail: "Score, accuracy, percentile and a question-by-question review with the website link.",
      },
      { kind: "feature", area: "Focus Zone", title: "Focus Zone: todos, habits, sessions and site blocking" },
    ],
  },
  {
    date: "2026-09-10",
    version: "v4.2",
    headline: "Real community feed & material lock",
    items: [
      {
        kind: "feature",
        area: "Feed",
        title: "Redesigned community feed on real data",
        detail: "Stories, nested comments, upvotes, bookmarks, General / Doubt / Note posts and live search.",
      },
      {
        kind: "security",
        area: "Materials",
        title: "Study material locked behind a rotating password",
        detail: "Protects copyrighted notes; unlock lasts 12 hours and admins can change the password any time.",
      },
      { kind: "improvement", area: "Theme", title: "One unified light/dark setting across the whole site, including Pulse" },
      { kind: "design", area: "Theme", title: "Legacy UI option alongside Liquid Glass" },
    ],
  },
  {
    date: "2026-09-02",
    version: "v4.1",
    headline: "Anti-abuse & message actions",
    items: [
      {
        kind: "security",
        area: "Security",
        title: "Bot, spam and brute-force protection",
        detail: "Human check on sign-in/sign-up/forms, server-side rate limits and security headers.",
      },
      { kind: "feature", area: "Messages", title: "WhatsApp-style tap & long-press action menu everywhere" },
      { kind: "improvement", area: "SEO", title: "New JEE Advanced Physics and Mathematics problem pages" },
    ],
  },
  {
    date: "2026-08-25",
    version: "v3.6",
    headline: "New home page + Updates timeline",
    items: [
      {
        kind: "design",
        area: "Home",
        title: "Completely redesigned home page",
        detail:
          "New liquid-glass hero, live countdown rail, quick-action grid, and a compact 'what shipped today' strip.",
      },
      {
        kind: "feature",
        area: "Updates",
        title: "Updates & History tool at /updates",
        detail:
          "Every change to the site, grouped by day, with search and filters for new features, improvements, fixes, security and design.",
      },
    ],
  },
  {
    date: "2026-08-24",
    version: "v3.5",
    headline: "Liquid glass polish",
    items: [
      {
        kind: "improvement",
        area: "Theme",
        title: "Clearer, higher-contrast glass cards",
        detail: "Transform-only sheen waves and drifting refraction highlights that hold 60fps on mobile.",
      },
      {
        kind: "improvement",
        area: "Theme",
        title: "Ripple shimmer on hover and focus",
      },
      {
        kind: "fix",
        area: "Mobile",
        title: "Lighter blur on small screens to stop frame drops",
      },
    ],
  },
  {
    date: "2026-08-22",
    version: "v3.4",
    headline: "Open access + background controls",
    items: [
      {
        kind: "feature",
        area: "Access",
        title: "Browse the whole site without an account",
        detail: "No sign-up, no email — every page opens in read-only mode.",
      },
      {
        kind: "feature",
        area: "Theme",
        title: "Background motion settings",
        detail: "Turn colour cycling on/off, tune visibility and speed. Saved on your device only.",
      },
    ],
  },
  {
    date: "2026-08-18",
    version: "v3.3",
    headline: "Quiz Arena",
    items: [
      { kind: "feature", area: "Quiz", title: "Daily Challenge — 10 questions, same for everyone" },
      { kind: "feature", area: "Quiz", title: "Question Battle rapid-fire rounds from the full test bank" },
      { kind: "feature", area: "Countdown", title: "Engineering exam countdown widget" },
    ],
  },
  {
    date: "2026-08-12",
    version: "v3.2",
    headline: "Profile & planner",
    items: [
      { kind: "feature", area: "Planner", title: "Subject-grouped study planner with a date strip" },
      { kind: "improvement", area: "Profile", title: "XP shown on profile, live username availability check" },
      { kind: "improvement", area: "Tests", title: "Reworked test review with single-question view and palette" },
    ],
  },
  {
    date: "2026-08-05",
    version: "v3.1",
    headline: "Pulse feed",
    items: [
      { kind: "feature", area: "Pulse", title: "Pulse combines admin videos and community posts" },
      { kind: "feature", area: "Pulse", title: "Continue watching + watch history" },
      { kind: "improvement", area: "Community", title: "Threaded doubts, reactions, @mentions and seen receipts" },
    ],
  },
  {
    date: "2026-07-28",
    version: "v3.0",
    headline: "Test Series / CBT",
    items: [
      { kind: "feature", area: "Tests", title: "JEE-style CBT player with KaTeX maths rendering" },
      { kind: "feature", area: "Tests", title: "AI-assisted PDF question import with admin approval" },
      { kind: "security", area: "Tests", title: "Answer keys moved server-side so they can never leak to the browser" },
    ],
  },
  {
    date: "2026-07-15",
    version: "v2.5",
    headline: "Certificates, streaks & Pro",
    items: [
      { kind: "feature", area: "Certificates", title: "Verifiable certificates for streaks and study hours" },
      { kind: "feature", area: "Streaks", title: "Streak flame, history and recovery" },
      { kind: "feature", area: "Pro", title: "Merit-based JEE Prep Hub Pro for leaderboard champions" },
    ],
  },
  {
    date: "2026-06-30",
    version: "v2.0",
    headline: "Community & messaging",
    items: [
      { kind: "feature", area: "Community", title: "Live community chat, notice board and polls" },
      { kind: "feature", area: "Messages", title: "Direct messages, follows and online presence" },
      { kind: "feature", area: "Feed", title: "Social feed with likes and comments" },
    ],
  },
  {
    date: "2026-06-10",
    version: "v1.0",
    headline: "JEE Prep Hub launch",
    items: [
      { kind: "feature", area: "Materials", title: "Curated notes, modules, PYQs and tests" },
      { kind: "feature", area: "Timer", title: "Pomodoro focus timer with study tracking" },
      { kind: "feature", area: "Leaderboard", title: "Weekly leaderboard based on study hours" },
    ],
  },
];

export const latestUpdate = changelog[0];

export function totalChangeCount() {
  return changelog.reduce((n, d) => n + d.items.length, 0);
}

export function totalReleaseDayCount() {
  return changelog.filter((day) => day.items.length > 0).length;
}

export function formatChangeDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
