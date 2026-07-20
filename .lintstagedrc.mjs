/**
 * Staged-file checks run by the pre-commit hook.
 *
 * `eslint --fix` autofixes what it can and fails the commit on any remaining
 * error. Warnings are reported but do not block — the codebase still carries
 * ~156 of them (mostly no-unused-vars and no-img-element).
 *
 * Type-checking is deliberately absent here — tsc cannot type-check a subset of
 * files correctly, so it runs whole-project in the pre-push hook instead.
 */
const config = {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["eslint --fix"],
};

export default config;
