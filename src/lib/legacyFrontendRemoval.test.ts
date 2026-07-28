import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts: Record<string, string>;
};
const astroConfig = readFileSync(
  new URL('../../astro.config.mjs', import.meta.url),
  'utf8'
);
const wranglerConfig = readFileSync(
  new URL('../../wrangler.jsonc', import.meta.url),
  'utf8'
);

const legacyFiles = [
  'index.html',
  'vite.config.ts',
  'tsconfig.node.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/App.css',
  'src/router.tsx',
  'src/components/HomePage.tsx',
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/NavigationMenu.tsx',
  'src/components/NotFoundPage.tsx',
  'src/components/RecentScansSection.tsx',
  'src/components/ScanSection.tsx',
  'src/components/ui/navigation-menu.tsx',
];

const legacyPackages = [
  '@cloudflare/vite-plugin',
  '@posthog/react',
  '@radix-ui/react-navigation-menu',
  '@vitejs/plugin-react-swc',
  'react-router-dom',
];

describe('Astro frontend cutover', () => {
  it('has no legacy SPA entrypoint or React shell', () => {
    const existingLegacyFiles = legacyFiles.filter((relativePath) =>
      existsSync(`${repositoryRoot}/${relativePath}`)
    );

    expect(existingLegacyFiles).toEqual([]);
  });

  it('has no direct dependencies that only supported the legacy SPA', () => {
    const directDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const installedLegacyPackages = legacyPackages.filter(
      (packageName) => directDependencies[packageName] !== undefined
    );

    expect(installedLegacyPackages).toEqual([]);
  });

  it('uses Astro for the default build and the repository Wrangler config', () => {
    const legacyScripts = Object.keys(packageJson.scripts).filter((scriptName) =>
      scriptName.includes('legacy')
    );

    expect(packageJson.scripts.build).toContain('astro build');
    expect(packageJson.scripts.deploy).toBe(
      'npm run build && wrangler deploy --config wrangler.jsonc'
    );
    expect(packageJson.scripts['deploy:dry']).toBe(
      'npm run build && wrangler deploy --config wrangler.jsonc --dry-run'
    );
    expect(packageJson.scripts['cf-typegen']).toBe(
      'wrangler types --config wrangler.jsonc --include-runtime false'
    );
    expect(legacyScripts).toEqual([]);
  });

  it('uses dist as the final frontend deployment directory', () => {
    expect(astroConfig).toContain("outDir: './dist'");
    expect(wranglerConfig).toContain('"directory": "./dist"');
  });
});
