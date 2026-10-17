# Releasing JEE Prep Hub

JEE Prep Hub is an application repository, not a published npm package. A GitHub Release is a **source snapshot**; it does not deploy the site, provision Supabase, or publish package contents to npm.

## Versioning

Use Semantic Versioning:

- **Patch** (`0.1.1`): backward-compatible fixes.
- **Minor** (`0.2.0`): backward-compatible features while the project is pre-1.0.
- **Major** (`1.0.0`): the first stable release, then breaking changes in later major versions.
- Pre-release identifiers (for example, `1.0.0-rc.1`) are allowed by the release workflow.

Every release tag must match the `package.json` version. Versions beginning with `0.` are automatically marked as pre-releases.

## Release checklist

1. Start from the latest `main` and confirm the working tree is clean.
2. Update `CHANGELOG.md` with user-visible changes, limitations, and any migration or configuration notes.
3. Set the version and update the npm lockfile together:

   ```bash
   npm version --no-git-tag-version <major.minor.patch>
   ```

4. Run the project checks:

   ```bash
   npm ci
   npm run check
   ```

5. Commit the changelog, version, and lockfile changes to `main`.
6. Create and push an annotated version tag that matches `package.json`:

   ```bash
   git tag -a v<major.minor.patch> -m "Release v<major.minor.patch>"
   git push origin v<major.minor.patch>
   ```

7. The **Release** workflow installs locked dependencies, checks documentation/repository-metadata formatting, builds the production app, verifies that the tag matches `package.json`, then creates a GitHub Release with generated notes. If validation fails, it does not create the release. The existing app-wide ESLint backlog is not a blocking release check; see the [contribution guide](CONTRIBUTING.md).

Do not put credentials, student data, or environment files in a changelog or release description. Keep Supabase configuration and deployment steps in the appropriate deployment documentation; this workflow never publishes a deployment.
