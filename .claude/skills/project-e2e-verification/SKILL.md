---
name: project-e2e-verification
description: Run the project locally and execute end-to-end validation from simple to complex scenarios. Use when user asks to start app, test UI representation, test presets/custom scenarios, check browser console errors, inspect test output, and provide PASS/FAIL evidence.
---

# PROJECT E2E VERIFICATION - Run + Test + Evidence

Use this skill when the user asks to:
- run the project locally
- test whether UI works in practice
- validate scenarios from basic to advanced
- verify presets and custom flows
- inspect console/output for errors
- provide hard pass/fail evidence

## 1. HARD RULES

1. Do not stop at "it should work". Always run real checks.
2. Start with simple scenarios, then move to medium, then complex.
3. Always check command output and browser console.
4. If MCP browser tools fail, use CLI Playwright and clearly state fallback.
5. Report facts only: what was executed, what passed, what failed, what was fixed.

## 2. PROJECT BOOTSTRAP

Run from repository root:

```powershell
Set-Location "<repo>/react-app"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Success criteria:
- dev server prints Local URL (127.0.0.1:5173)
- page is reachable in browser

If command fails because cwd is wrong, fix cwd and rerun.

## 3. TEST PYRAMID (MANDATORY ORDER)

### Stage A - Smoke (basic)

Goal: app shell and critical controls render.

Checks:
- top bar visible
- canvas visible
- left and right sidebars visible
- simulation button toggles start/stop

Primary method:

```powershell
npx playwright test e2e/app.spec.ts --grep "core UI|simulation"
```

### Stage B - Representation and interaction (medium)

Goal: verify UI behavior, canvas interactions, modal mechanics.

Checks:
- drag agent to canvas
- load preset and render nodes
- delete/select behaviors
- keyboard shortcuts
- cost and mermaid modals open/close

Primary method:

```powershell
npx playwright test e2e/canvas-interactions.spec.ts e2e/modals.spec.ts
```

### Stage C - Scenario validation (complex)

Goal: verify end-to-end scenario execution, including simulation timeline behavior.

Checks:
- load at least one preset scenario (for example Solo)
- start simulation
- observe timeline/log updates
- confirm no blocker errors in test output

Primary method:

```powershell
npx playwright test
```

## 4. MCP PLAYWRIGHT CHECK (WHEN AVAILABLE)

After CLI tests, run one MCP browser scenario:
- open app URL
- load preset
- start simulation
- assert timeline/log has processing message

If MCP context/browser closes unexpectedly, document this and fallback to CLI evidence.

## 5. CONSOLE + OUTPUT INSPECTION

Always capture these signals:
- terminal exit code for every command
- test summary (passed/failed counts)
- any console errors from browser session
- any network/API errors if scenario uses LLM/debug mode

Do not claim success if errors are present and unexplained.

## 6. FAILURE HANDLING

If tests fail:
1. isolate failing spec with --grep
2. reproduce locally
3. inspect related component/store
4. fix root cause
5. rerun targeted tests
6. rerun broader suite to confirm no regressions

## 7. REQUIRED RESULT FORMAT

Use this structure in the final report:

```text
Server:
- status: running/stopped
- url: ...

Executed:
1. <command>
2. <command>
...

Results:
- smoke: PASS/FAIL
- representation: PASS/FAIL
- scenarios: PASS/FAIL
- mcp browser scenario: PASS/FAIL (or FALLBACK)

Console and output review:
- terminal errors: none / list
- browser console errors: none / list

Final verdict:
- PASS (ready)
- FAIL (blocked) + exact blocker
```

## 8. MINIMUM BAR TO SAY "WORKS"

You can say "works" only when all are true:
- dev server started successfully
- at least one smoke test passed
- representation test group passed
- scenario test group passed
- no unresolved critical console/runtime errors

If any point is missing, say what is missing and continue until complete.
