# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**, and this project follows **Semantic Versioning**.

## Versioning

Project releases are aligned with the milestones defined in `ROADMAP.md`.

Each release represents a stable milestone in the evolution of the repository. Patch releases may be issued between milestones for backward-compatible corrections, including material documentation corrections. Existing tags remain immutable.

---

## [Unreleased]

### Added

- Phase 2 core backend scope, architectural decisions, and measurable acceptance criteria.
- Initial API runtime with TypeScript, Express, development/build commands, and an HTTP smoke test.

### Changed

- Aligned project status and roadmap wording with the published `v0.1.1` release and Phase 2 planning baseline.
- Updated the project status to reflect that Phase 2 runtime implementation has begun while remaining acceptance criteria are still outstanding.
- Clarified that `apps/api`, `apps/admin`, and `apps/web` are independently managed applications; the API owns backend/database access, while the admin and web applications consume its public API.

---

## [0.1.1] - 2026-10-14

> Documentation patch release covering Phase 1 improvements merged after the existing `v0.1.0` tag. The original `v0.1.0` tag remains an immutable historical snapshot.

### Added

- Detailed architecture specifications for execution context, cross-module workflows, eventing and reliable delivery, failure handling and idempotency, module interaction performance, and observability and resilience.
- Accepted ADRs for execution context, configuration architecture, dependency injection and resolution, and module boundaries.
- A centralized architectural decision register and ADR index.
- GitHub issue templates for bug reports and feature requests.

### Changed

- Corrected documentation navigation, release-policy references, and handbook filenames while preserving empty placeholders.
- Clarified the distinction between current repository contents and capabilities planned for later roadmap phases.
- Aligned project metadata, documentation navigation, design terminology, and Phase 1 deliverables.
- Standardized the pull request template filename and updated `.gitignore` for repository development needs.
- Removed empty architecture placeholders where no documented content or inbound references existed.
- Defined release handling for post-tag corrections, including documentation fixes that materially affect the accuracy of a release snapshot.

---

## [0.1.0] - 2026-08-01

> Historical entry for the existing `v0.1.0` tagged snapshot. Changes merged after that tag belong under Unreleased until included in a later release.

### Added

#### Repository Foundation

* Initial repository structure
* Repository documentation
* Pull request template
* MIT License

#### Documentation

* `README.md`
* `PROJECT.md`
* `PHILOSOPHY.md`
* `DESIGN.md`
* `ROADMAP.md`
* `CONTRIBUTING.md`

#### Engineering Workflow

* Branching strategy
* Pull request workflow
* Code review guidelines
* Release strategy
* Repository governance

### Changed

*None.*

### Deprecated

*None.*

### Removed

*None.*

### Fixed

*None.*

### Security

* Added the MIT License to clearly define the project's licensing terms.

---

### Maintaining the Changelog

The changelog should summarize **notable changes**, not every commit.

When preparing a release:

1. Review the release scope and select the appropriate milestone or patch version.
2. Verify that the README, roadmap, and release notes accurately describe the tagged snapshot.
3. Move the included changes from **Unreleased** into the new version section and record the release date.
4. Create a fresh **Unreleased** section for future development.
5. Create the tag and GitHub Release only after the release snapshot has been reviewed and approved.

Never rewrite an existing version's changelog entry to include changes that were merged after its tag.
