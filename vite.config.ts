import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // If building inside a GitHub Action, extract repo name automatically from GITHUB_REPOSITORY (e.g. 'owner/mulus' => '/mulus/')
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
  const githubRepo = process.env.GITHUB_REPOSITORY;
  
  let base = '/';
  if (isGithubActions && githubRepo) {
    const repoName = githubRepo.split('/')[1];
    base = repoName ? `/${repoName}/` : '/';
  } else if (process.env.GITHUB_PAGES === 'true' || process.env.GH_PAGES === 'true' || process.env.BUILD_TARGET === 'gh-pages') {
    base = '/mulus/';
  }

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
