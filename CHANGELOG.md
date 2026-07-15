# Change Log

All notable changes to the CLIuno extension are documented here, following
[Keep a Changelog](https://keepachangelog.com/).

## [2.1.1]

Initial release.

- **CLIuno: Scaffold a new app** command — a Quick Pick wizard that scaffolds any
  CLIuno template into your workspace.
- Native scaffolding: clones the chosen template, detaches its git history, installs
  dependencies per stack, and opens the project. The `cliuno` CLI is not required.
- Full stack catalog: 7 web frontends, 11 backends, a full-stack TALL option, and 2
  mobile targets.
- Graceful fallback when a stack's toolchain is missing — the project is still cloned
  and the manual install command is shown.
