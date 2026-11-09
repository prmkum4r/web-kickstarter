import path from 'node:path'

// Saved session (cookies + localStorage) produced by the `setup` project. Gitignored.
export const AUTH_FILE = path.join(import.meta.dirname, '../playwright/.auth/user.json')
