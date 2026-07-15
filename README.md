# CLIuno

Scaffold a working full-stack app from CLIuno's contract-tested templates — without
leaving VS Code. Pick a stack, and the extension clones the right template, installs
dependencies, and opens the project.

Every CLIuno frontend works with every CLIuno backend: each pair is proven by a live
compatibility matrix (the shared demo app — auth, users, todos, posts + comments,
follows, OTP — on one REST contract). So whatever you pick, you start from something
that already runs.

## Usage

1. Open the Command Palette (`Ctrl/Cmd+Shift+P`).
2. Run **CLIuno: Scaffold a new app**.
3. Answer the prompts:
   - **Kind** — frontend (web), backend (REST API), mobile, or full-stack (one repo).
   - **Stack** — the specific framework.
   - **Package manager** — for JS/TS stacks (pnpm / npm / yarn / bun).
   - **Location** and **project name**.
4. The extension clones the template, detaches it from the template's git history
   (`git init` a fresh repo), installs dependencies, and offers to open the project.

## What you can scaffold

- **Frontends** — React, Vue, Solid, Next.js, Svelte, Nuxt, Angular
  (shadcn-style UI on Tailwind v4).
- **Backends** — Express, Fastify, NestJS, AdonisJS, Django, FastAPI, Laravel, Rails,
  Spring Boot, ASP.NET, Drogon (C++). All serve `/api/v1` on SQLite out of the box.
- **Full-stack** — TALL stack (Laravel + Livewire/Volt) in one repo.
- **Mobile** — Flutter, React Native (Expo).

## Requirements

- **Git** on your `PATH` (used to clone the template).
- The chosen stack's toolchain for the dependency install step (e.g. Node + your
  package manager, `composer`, `uv`, `bundler`, `flutter`, the .NET/JDK SDKs). If a
  toolchain is missing, the project is still cloned — the extension tells you the
  install command to run yourself.

## About

Powered by the [CLIuno](https://github.com/CLIuno) templates and the `cliuno` CLI.
The extension scaffolds natively (clones + installs itself); the CLI is not required.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
