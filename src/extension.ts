import { exec } from "node:child_process"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { promisify } from "node:util"
import * as vscode from "vscode"

import {
  CATEGORY_LABELS,
  Category,
  PACKAGE_MANAGERS,
  repoUrl,
  Template,
  TEMPLATES,
} from "./templates"

const run = promisify(exec)

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("cliuno.scaffold", () => scaffold()),
  )
}

export function deactivate() {}

async function scaffold(): Promise<void> {
  // 0. git is required for the native clone.
  try {
    await run("git --version")
  } catch {
    vscode.window.showErrorMessage("CLIuno needs Git on your PATH to scaffold a project.")
    return
  }

  // 1. category
  const categories: Category[] = ["frontend", "backend", "fullstack", "mobile"]
  const catPick = await vscode.window.showQuickPick(
    categories.map((c) => ({ label: CATEGORY_LABELS[c], category: c })),
    { title: "CLIuno — what do you want to scaffold?", placeHolder: "Choose a kind of project" },
  )
  if (!catPick) return

  // 2. template within the category
  const inCat = TEMPLATES.filter((t) => t.category === catPick.category)
  const tplPick = await vscode.window.showQuickPick(
    inCat.map((t) => ({ label: t.label, detail: t.detail, template: t })),
    { title: "CLIuno — choose a stack", placeHolder: "Every frontend×backend pair is contract-tested", matchOnDetail: true },
  )
  if (!tplPick) return
  const template = tplPick.template

  // 3. package manager (JS stacks only)
  let pmInstall = "npm i"
  if (template.needsPackageManager) {
    const pmPick = await vscode.window.showQuickPick(
      PACKAGE_MANAGERS.map((p) => ({ label: p.label, install: p.install })),
      { title: "CLIuno — package manager", placeHolder: "Used to install dependencies" },
    )
    if (!pmPick) return
    pmInstall = pmPick.install
  }

  // 4. destination folder
  const defaultParent =
    vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(os.homedir())
  const parentPick = await vscode.window.showOpenDialog({
    title: "CLIuno — where should the project go?",
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Scaffold here",
    defaultUri: defaultParent,
  })
  if (!parentPick || parentPick.length === 0) return
  const parent = parentPick[0].fsPath

  // 5. project name
  const suggested = suggestName(template)
  const name = await vscode.window.showInputBox({
    title: "CLIuno — project name",
    value: suggested,
    prompt: "A new folder with this name is created here",
    validateInput: (v) => validateName(v, parent),
  })
  if (!name) return

  const dest = path.join(parent, name)

  // 6. clone + install with progress
  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `CLIuno: scaffolding ${template.label}`,
      cancellable: false,
    },
    async (progress) => {
      try {
        progress.report({ message: "cloning template…" })
        await run(`git clone --depth 1 ${repoUrl(template)} "${dest}"`, { cwd: parent })

        // detach from the template's history, start a fresh repo
        await rimraf(path.join(dest, ".git"))
        await rimraf(path.join(dest, ".github"))
        await run("git init", { cwd: dest }).catch(() => undefined)

        const cmds = template.install(pmInstall)
        for (const cmd of cmds) {
          progress.report({ message: `${cmd}…` })
          await run(cmd, { cwd: dest, maxBuffer: 1024 * 1024 * 64 })
        }
        return { installed: true as const }
      } catch (err) {
        // The clone is the essential part; a failing install (missing toolchain)
        // shouldn't lose the scaffold — report it and let the user finish manually.
        if (!fs.existsSync(dest)) {
          vscode.window.showErrorMessage(`CLIuno: clone failed — ${errText(err)}`)
          return undefined
        }
        return { installed: false as const, error: errText(err) }
      }
    },
  )
  if (!result) return

  // 7. done — surface next steps and offer to open
  if (!result.installed) {
    const cmds = template.install(pmInstall).join(" && ") || "(none)"
    vscode.window.showWarningMessage(
      `CLIuno: cloned ${template.label}, but dependency install didn't finish (${result.error}). ` +
        `Install manually in the project: ${cmds}`,
    )
  }
  if (template.nextSteps) {
    vscode.window.showInformationMessage(
      `CLIuno next step for ${template.label}: ${template.nextSteps}`,
    )
  }

  const choice = await vscode.window.showInformationMessage(
    `CLIuno: ${template.label} scaffolded at ${dest}`,
    "Open",
    "Open in New Window",
  )
  if (choice) {
    await vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(dest),
      { forceNewWindow: choice === "Open in New Window" },
    )
  }
}

// ---------------------------------------------------------------- helpers

function suggestName(t: Template): string {
  const slug = t.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  return `cliuno-${slug}-app`
}

function validateName(v: string, parent: string): string | undefined {
  if (!v || !v.trim()) return "Enter a project name"
  if (/[\\/:*?"<>|]/.test(v)) return "Name can't contain path separators or special characters"
  if (fs.existsSync(path.join(parent, v))) return `"${v}" already exists here`
  return undefined
}

function errText(err: unknown): string {
  if (err && typeof err === "object" && "stderr" in err && (err as { stderr?: string }).stderr) {
    return String((err as { stderr: string }).stderr).trim().split("\n").slice(-1)[0]
  }
  return err instanceof Error ? err.message : String(err)
}

async function rimraf(p: string): Promise<void> {
  await fs.promises.rm(p, { recursive: true, force: true }).catch(() => undefined)
}
