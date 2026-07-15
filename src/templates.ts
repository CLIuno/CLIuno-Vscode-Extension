// The CLIuno template catalog. Mirrors the `cliuno` CLI's framework list and
// per-stack install commands, so the extension can scaffold natively (clone +
// install) without the CLI being installed.

export type Category = "frontend" | "backend" | "mobile" | "fullstack"

export interface Template {
  /** Stable id (matches the CLI's links map key). */
  id: string
  /** Human label shown in the picker. */
  label: string
  /** One-line description shown in the picker. */
  detail: string
  category: Category
  /** GitHub repo name under the CLIuno org. */
  repo: string
  /** Whether to ask for a JS package manager (npm/pnpm/yarn/bun). */
  needsPackageManager: boolean
  /**
   * Post-clone install commands. `pm` is the chosen package-manager install
   * command (e.g. "pnpm i") for JS stacks. Empty = clone only.
   */
  install: (pm: string) => string[]
  /** Shown after scaffolding when there's a manual next step. */
  nextSteps?: string
}

const ORG = "https://github.com/CLIuno"

export function repoUrl(t: Template): string {
  return `${ORG}/${t.repo}.git`
}

export const PACKAGE_MANAGERS: { label: string; value: string; install: string }[] = [
  { label: "pnpm", value: "pnpm", install: "pnpm i" },
  { label: "npm", value: "npm", install: "npm i" },
  { label: "yarn", value: "yarn", install: "yarn" },
  { label: "bun", value: "bun", install: "bun i" },
]

export const TEMPLATES: Template[] = [
  // ---- web frontends (shadcn-style UI, Tailwind v4) ----
  fe("ReactJs", "React", "React 19 + Vite, shadcn/ui on Base UI", "CLIuno-React-template"),
  fe("VueJs", "Vue", "Vue 3 + Vite, shadcn-vue on reka-ui", "CLIuno-Vue-template"),
  fe("SolidJs", "Solid", "SolidJS + Vite, shadcn-style on Kobalte", "CLIuno-Solid-template"),
  fe("NextJs", "Next.js", "Next.js 15 app router, shadcn/ui on Base UI", "CLIuno-Next-template"),
  fe("Svelte", "Svelte", "SvelteKit 2 (runes), shadcn-svelte on bits-ui", "CLIuno-Svelte-template"),
  fe("NuxtJs", "Nuxt", "Nuxt + shadcn-vue (shadcn-nuxt)", "CLIuno-Nuxt-template"),
  fe("Angular", "Angular", "Angular 19 + spartan-ng helm components", "CLIuno-Angular-template"),

  // ---- backends (all serve /api/v1 on SQLite) ----
  beJs("ExpressJs", "Express", "Express 5 + TypeORM", "CLIuno-Express-template"),
  beJs("Fastify", "Fastify", "Fastify + TypeORM", "CLIuno-Fastify-template"),
  beJs("NestJs", "NestJS", "NestJS 10 + TypeORM", "CLIuno-Nest-template"),
  {
    id: "AdonisJs",
    label: "AdonisJS",
    detail: "AdonisJS 6 + Lucid",
    category: "backend",
    repo: "CLIuno-Adonis-template",
    needsPackageManager: true,
    install: (pm) => [pm],
    nextSteps: "Set APP_KEY in .env, then run: node ace migration:run",
  },
  be("Django", "Django", "Django + DRF-style API (uv)", "CLIuno-Django-template", ["uv sync"], "Run: uv run python manage.py migrate && uv run python manage.py runserver"),
  be("FastAPI", "FastAPI", "FastAPI + SQLAlchemy (uv)", "CLIuno-FastAPI-template", ["uv sync"], "Run: uv run uvicorn src.app:app --reload"),
  {
    id: "Laravel",
    label: "Laravel",
    detail: "Laravel 12 + Sanctum",
    category: "backend",
    repo: "CLIuno-Laravel-template",
    needsPackageManager: true,
    install: (pm) => ["composer install", pm],
    nextSteps: "Run: php artisan migrate && php artisan serve",
  },
  be("Rails", "Rails", "Rails 8 API", "CLIuno-Rails-template", ["bundle install"], "Run: bin/rails db:prepare && bin/rails server"),
  be("Spring Boot", "Spring Boot", "Spring Boot 3.4 (Java 17)", "CLIuno-Spring-template", [], "Run: ./mvnw spring-boot:run"),
  be("ASP.NET", "ASP.NET", "ASP.NET Core 8 + EF Core", "CLIuno-ASP.NET-template", [], "Run: dotnet run --project BackendASP.NET"),
  be("Drogon", "Drogon (C++)", "Drogon C++17, builds in the drogon Docker image", "CLIuno-Drogon-template", [], "Build in the drogonframework/drogon image — see the repo README."),

  // ---- fullstack (one repo) ----
  {
    id: "TallStack",
    label: "TALL stack",
    detail: "Laravel 13 + Livewire/Volt UI, also serves the REST API",
    category: "fullstack",
    repo: "CLIuno-TallStack-template",
    needsPackageManager: true,
    install: (pm) => ["composer install", pm],
    nextSteps: "Run: php artisan migrate && npm run build && php artisan serve",
  },

  // ---- mobile (native design systems) ----
  be("Flutter", "Flutter", "Flutter (Material 3), android/ios/web", "CLIuno-Flutter-template", ["flutter pub get"], "Run: flutter run"),
  {
    id: "ReactNative",
    label: "React Native",
    detail: "Expo SDK 57 + expo-router",
    category: "mobile",
    repo: "CLIuno-ReactNative-template",
    needsPackageManager: false,
    install: () => ["npm install"],
    nextSteps: "Run: npm start",
  },
]

// -- small builders to keep the catalog readable --
function fe(id: string, label: string, detail: string, repo: string): Template {
  return { id, label, detail, category: "frontend", repo, needsPackageManager: true, install: (pm) => [pm] }
}
function beJs(id: string, label: string, detail: string, repo: string): Template {
  return { id, label, detail, category: "backend", repo, needsPackageManager: true, install: (pm) => [pm] }
}
function be(
  id: string,
  label: string,
  detail: string,
  repo: string,
  cmds: string[],
  nextSteps?: string,
): Template {
  const category: Category = id === "Flutter" ? "mobile" : "backend"
  return { id, label, detail, category, repo, needsPackageManager: false, install: () => cmds, nextSteps }
}

export const CATEGORY_LABELS: Record<Category, string> = {
  frontend: "Frontend — web app",
  backend: "Backend — REST API",
  mobile: "Mobile app",
  fullstack: "Full-stack — one repo (MVC)",
}
