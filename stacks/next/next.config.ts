import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  sassOptions: {
    // Breakpoints + mixins reach every stylesheet without an explicit @use (see docs/design-system.md).
    loadPaths: [path.join(import.meta.dirname, 'src/styles')],
    additionalData: '@use "core" as *;\n',
  },
}

export default nextConfig
