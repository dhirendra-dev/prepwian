# Contributing to JEE Prep Hub

Thank you for helping improve JEE Prep Hub. Contributions can include bug fixes, accessibility improvements, documentation, performance work, and thoughtful product enhancements.

> **Before you start:** For substantial changes, open an issue first to discuss the problem and intended approach. This helps avoid duplicated work and keeps product changes aligned with student needs.

## Code of conduct

Participation in JEE Prep Hub spaces is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing; it explains community expectations, unacceptable behavior, and how to report a concern privately.

## Find or propose work

- Check the [roadmap](roadmap.md) and existing [issues](https://github.com/dhirendra-dev/prepwian/issues) before starting.
- Use the [bug report](.github/ISSUE_TEMPLATE/bug_report.yml) or [feature request](.github/ISSUE_TEMPLATE/feature_request.yml) form when opening an issue.
- For security concerns, follow [`SECURITY.md`](SECURITY.md); do not disclose vulnerabilities in public issues.
- For broad or behavior-changing work, describe the user problem, proposed outcome, and relevant constraints in an issue before implementation.

## Set up your workspace

### Prerequisites

- Node.js 22.18 or newer, with npm (or Bun)
- Git
- A Supabase project and local environment values for features that use backend services

### Install and run

```bash
git clone https://github.com/dhirendra-dev/prepwian.git
cd prepwian
npm ci
cp .env.example .env
npm run dev
```

Fill in only the environment values needed for your local work. See the README's [environment-variable guidance](README.md#-environment-variables) and [`SYSTEM_CONTROL_SETUP.md`](SYSTEM_CONTROL_SETUP.md) for the admin System Control Center. Never commit `.env` or real credentials.

Bun is also supported through the repository's `bun.lock`:

```bash
bun install
bun run dev
```

## Make a change

1. Start from an up-to-date `main` branch and create a focused branch:

   ```bash
   git switch main
   git pull --ff-only
   git switch -c type/short-description
   ```

   Example: `fix/mobile-material-filters` or `docs/contribution-guide`.

2. Keep the change focused and consistent with the existing component, route, and feature organization.
3. Preserve existing data flows and authorization boundaries. In particular, keep privileged operations server-side and do not bypass established shared hooks or role checks.
4. Include appropriate UI states and consider keyboard navigation, responsive layouts, and accessibility when changing user-facing features.
5. Update relevant documentation when behavior, setup, or configuration changes.

## Validate your work

Run the project checks that apply to your change before opening a pull request:

```bash
npm run check
```

`npm run check` runs formatting checks for documentation and repository metadata, followed by a production build. A dedicated unit-test suite is not yet defined; if you add tests, document and run the relevant test command. The same checks run automatically on pull requests and pushes to `main`.

The existing `npm run lint` command currently reports a large application-wide backlog of formatting and TypeScript-rule findings. It remains available for targeted work but is not a blocking CI or release check yet. Avoid mass-formatting the app or weakening lint rules in an unrelated change; the backlog should be addressed in a focused effort.

For database or Supabase changes, describe any migration or environment setup required and validate the affected behavior without exposing production secrets or changing live data unintentionally.

## Commit and open a pull request

- Use a clear commit message that explains the change (for example, `fix: handle empty study plans`).
- Open a pull request against `main` with a concise title and a description covering:
  - **Why:** the user problem or motivation.
  - **What:** the important implementation or documentation changes.
  - **Validation:** checks run and relevant screenshots for UI changes.
  - **Notes:** migration, configuration, risks, or limitations reviewers should know.
- Keep the pull request focused; separate unrelated refactors or formatting changes.
- Be responsive to review feedback and update the pull request with follow-up commits.

## Releases

Only maintainers create version tags and GitHub Releases. User-visible changes should be recorded in [`CHANGELOG.md`](CHANGELOG.md). Before preparing a release, follow [`RELEASING.md`](RELEASING.md); the tag-triggered workflow validates the source and creates a source release, but it does not deploy the application.

## Security and sensitive data

Never commit API keys, Supabase service-role keys, encryption keys, database credentials, access tokens, `.env` files, private user information, or production data. Use `.env.example` for safe variable names only. Do not place server-only secrets in `VITE_*` variables or client-side code.

If a change touches authentication, authorization, moderation, or sensitive data, explain how the relevant access boundaries were preserved and validated. Report suspected vulnerabilities according to [`SECURITY.md`](SECURITY.md), not through public issue templates.

## Questions

For implementation questions or product discussion, open an issue with enough context to make the question actionable. For a bug, include steps to reproduce, expected behavior, actual behavior, and your environment.
