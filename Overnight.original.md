# Overnight Build — PrintGrid Studio Frontend (Next.js)

Authoritative spec: /PROJECT_BRIEF.md (with Section 8 OVERRIDDEN — we're using Next.js)
Design contract: /DESIGN.md (unchanged, non-negotiable)

You are in Auto Mode. Do not ask permission for routine operations.

## Operating principles

1. Plan each task before executing. Write the plan to /BUILD_LOG/task-N-plan.md.
2. Commit after each task: `feat(<scope>): <what>`.
3. Run design-reviewer subagent after each task against the new files.
4. If REVISE: fix BLOCKER and MAJOR items, re-run reviewer once. Max 2 revision cycles per task. If still REVISE, write open issues to /BUILD_LOG/needs-human.md and proceed.
5. Tag the repo `night-1-task-N-complete` after each successful task.
6. Sequential. Don't skip ahead.
7. Frontend ONLY tonight. No /api routes, no Prisma, no Razorpay, no Resend, no auth, no DB. Mock all data.
8. No new dependencies beyond what each task lists. If you need one, write to needs-human.md and find a workaround.

## Stack (NON-NEGOTIABLE for v1)

- Next.js 14 App Router
- TypeScript strict (`noUncheckedIndexedAccess: true`, no `any`, no `as any`)
- CSS Modules per component + `/app/globals.css` for design tokens
- **NO Tailwind, NO styled-components, NO Emotion, NO CSS-in-JS libraries**
- next/font/google for Inter + JetBrains Mono
- React Three Fiber + Drei (only on /quote)
- React Hook Form + Zod for forms
- Classic Web Worker for STL parsing (in /public/)
- Vercel or Cloudflare Pages deploy target

## Folder structure