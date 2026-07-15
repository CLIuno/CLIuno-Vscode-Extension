import * as assert from "assert"
import * as vscode from "vscode"

import { CATEGORY_LABELS, TEMPLATES } from "../templates"

suite("CLIuno extension", () => {
  test("registers the scaffold command", async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes("cliuno.scaffold"), "cliuno.scaffold should be registered")
  })

  test("template catalog is well-formed", () => {
    assert.ok(TEMPLATES.length >= 20, "should ship the full stack catalog")
    for (const t of TEMPLATES) {
      assert.ok(t.id && t.label && t.repo, `${t.id}: id/label/repo required`)
      assert.ok(t.repo.startsWith("CLIuno-"), `${t.id}: repo should be a CLIuno template`)
      assert.ok(CATEGORY_LABELS[t.category], `${t.id}: unknown category ${t.category}`)
      assert.ok(Array.isArray(t.install("npm i")), `${t.id}: install() must return commands`)
    }
  })

  test("every category has at least one template", () => {
    for (const category of Object.keys(CATEGORY_LABELS)) {
      assert.ok(
        TEMPLATES.some((t) => t.category === category),
        `category ${category} has no templates`,
      )
    }
  })
})
