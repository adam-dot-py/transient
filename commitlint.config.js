module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, no code change
        'refactor', // Code restructuring
        'perf',     // Performance improvement
        'test',     // Adding/updating tests
        'build',    // Build system / dependencies
        'ci',       // CI/CD changes
        'chore',    // Maintenance tasks
        'revert',   // Revert a commit
      ],
    ],
    'subject-case': [0], // Allow any case in subject
    'body-max-line-length': [0], // No body line length limit
  },
};
