# Contributing to TalentOS

Thank you for helping build open hiring infrastructure.

## How to work

1. Fork the repository and create a branch from `main`.
2. Keep changes focused: one problem, one PR.
3. Add or update tests for matching, parsing, and API edge cases.
4. Run `pytest` in `backend/` before you open a pull request.
5. Describe the product problem you solved, not only the files you touched.

## Local setup

See `docs/SETUP.md`.

## Design rules for this codebase

- Matching scores must be explainable. Do not return a number without a breakdown.
- Skill aliases belong in `backend/app/ai/skills.py` so "JS" and "JavaScript" never diverge.
- Pipeline transitions are explicit. If a move is illegal, reject it with a clear error.
- Prefer deterministic intelligence that works offline. Embeddings can wrap this layer later.

## Pull request checklist

- [ ] Tests cover the new behavior
- [ ] API errors are specific
- [ ] Recruiter and candidate permissions still hold
- [ ] README / docs updated if the contract changed
