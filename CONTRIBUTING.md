# CONTRIBUTING

> *Great software is built through collaboration. This document describes how contributions are made to **mern-enterprise-starter**, ensuring that every change supports the project's long-term maintainability, consistency, and engineering standards.*

---

# Welcome

Thank you for considering contributing to this project.

Every contribution, regardless of size, helps improve the repository.

Whether you're fixing a typo, improving documentation, reporting a bug, or implementing a new feature, your contribution is appreciated.

The goal of this document is not simply to explain how to submit code, but to describe the engineering workflow used throughout the project.

---

# Before You Contribute

Before contributing, please take a few minutes to become familiar with the project.

The following documents provide important context:

* `PROJECT.md` — What the project is and its goals.
* `PHILOSOPHY.md` — The engineering principles that guide decision-making.
* `DESIGN.md` — The architectural structure of the repository.
* `ROADMAP.md` — The planned evolution of the project.

Understanding these documents will help ensure that new contributions remain consistent with the project's long-term vision.

---

# Development Workflow

Every contribution follows the same workflow.

```text
Identify a Change
        │
        ▼
Create a Branch
        │
        ▼
Implement the Change
        │
        ▼
Self Review
        │
        ▼
Open a Pull Request
        │
        ▼
Code Review
        │
        ▼
Request Changes / Approve
        │
        ▼
Squash & Merge
        │
        ▼
Release (when applicable)
```

---

# Branch Strategy

The `main` branch always represents the latest stable state of the repository.

Contributors should create feature branches for all changes.

Examples:

```text
feature/authentication
feature/docker-environment
feature/file-upload

fix/refresh-token
fix/log-format

docs/design
docs/readme

refactor/module-loader

chore/github-actions
```

Branches should have a single, well-defined purpose.

Large features should be divided into smaller, reviewable pull requests whenever practical.

---

# Commit Conventions

This repository follows the Conventional Commits specification.

Commits should describe **what changed**, not **how it was implemented**.

### Format

```text
<type>(<scope>): <description>
```

### Examples

```text
feat(auth): add JWT authentication

fix(cache): handle Redis reconnection

docs(design): add repository design documentation

docs(roadmap): add project roadmap

refactor(api): simplify route registration

test(auth): add refresh token tests

build(docker): add development environment

ci(github): add CI workflow

chore(github): add pull request template
```

---

## Commit Types

| Type       | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| `feat`     | Introduces new functionality                          |
| `fix`      | Resolves a defect                                     |
| `docs`     | Documentation changes                                 |
| `refactor` | Improves internal structure without changing behavior |
| `test`     | Adds or updates tests                                 |
| `build`    | Build system or dependency changes                    |
| `ci`       | Continuous Integration or deployment workflow changes |
| `chore`    | Repository maintenance and configuration              |

Each commit should represent a single logical change whenever possible.

---

# Self Review

Before opening a pull request, review your own changes.

Consider the following questions:

* Does this change solve the intended problem?
* Does it align with the project's architecture?
* Does it align with the project's engineering philosophy?
* Is the implementation as simple as possible?
* Have I updated the documentation where necessary?
* Would I be comfortable reviewing this contribution myself?

Note: Self-review often catches issues before they reach other reviewers and results in higher-quality pull requests.

---

# Pull Requests

Every contribution should be submitted through a pull request.

The pull request should according to pull request template.

---

# Code Review Guidelines

Reviews should focus on the implementation rather than the individual contributor. Constructive feedback, thoughtful discussion, and shared learning are encouraged throughout the review process.

Reviewers should provide clear reasoning for their suggestions and distinguish between blocking issues and optional improvements whenever possible.

---

## Review Principles

When reviewing a contribution, consider the following questions.

### Product

* Does the change solve the intended problem?
* Is the scope appropriate for the proposed solution?

### Architecture

* Does the implementation align with `DESIGN.md`?
* Are existing architectural boundaries respected?
* Does the change introduce unnecessary coupling?

### Engineering Philosophy

* Does the implementation align with `PHILOSOPHY.md`?
* Is clarity preferred over cleverness?

### Maintainability

* Is the implementation easy to understand?
* Can the solution be simplified?
* Will this decision still make sense in the future?

### Documentation

* Is the documentation accurate and complete?
* Are new architectural decisions appropriately documented?

---

## Review Outcomes

A review typically results in one of the following outcomes.

### Approve

The contribution is ready to be merged.

### Approve with Suggestions

The contribution is acceptable as-is, but optional improvements have been identified that may be addressed in a future pull request.

### Request Changes

Additional work is required before the contribution can be merged.

Whenever requesting changes, reviewers should provide clear guidance so contributors understand the reasoning behind the requested revisions.

---

# Documentation Standards

Documentation is considered part of the software.

Changes that affect architecture, workflows, configuration, or developer experience should be reflected in the appropriate documentation.

Contributors should avoid duplicating information across multiple documents. Instead, each document should maintain a single, well-defined responsibility.

Whenever possible, documentation should explain not only **what** was done, but also **why** the decision was made.

---

# Release Process

Development follows the release strategy defined in `ROADMAP.md`.

Each completed phase generally follows this workflow:

```text
Create Feature Branch
        │
        ▼
Implement Change
        │
        ▼
Self Review
        │
        ▼
Open Pull Request
        │
        ▼
Code Review
        │
        ▼
Squash & Merge
        │
        ▼
Create Git Tag
        │
        ▼
Publish GitHub Release
```

Each release represents a stable milestone in the evolution of the repository.

---

# Communication

Questions, suggestions, bug reports, and improvement ideas are always welcome.

Constructive discussions help improve both the project and the engineering decisions behind it.

Contributors are encouraged to ask questions whenever the reasoning behind a decision is unclear.

Clear communication is considered an important part of successful collaboration.

---

# Code of Conduct

All contributors are expected to read `the CODE_OF_CONDUCT.md` file.

---

# Thank You

Thank you for taking the time to read this document.


The goal of this repository is not only to provide a production-ready foundation for MERN applications but also to demonstrate the engineering practices that support maintainable and scalable software over time.

Your contribution is an important part of that journey.
