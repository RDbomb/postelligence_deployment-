/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Types allowed in `type(scope): subject`
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "perf",
        "docs",
        "style",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    // Subject: lower-case, no trailing period, non-empty
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 100],
    // Body/footer need a blank line before them
    "body-leading-blank": [2, "always"],
    "footer-leading-blank": [2, "always"],
  },
};

export default config;
