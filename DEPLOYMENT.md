# GitHub Pages Deployment

This repository is now configured to automatically deploy to GitHub Pages.

## How it works

1. **Automatic Deployment**: Every push to the `main` branch triggers a GitHub Actions workflow that builds and deploys the site
2. **Build Process**: The workflow runs `npm ci` to install dependencies and `npm run build` to create optimized production assets
3. **GitHub Pages**: The built site is automatically deployed to GitHub Pages at `https://clicker.poyningscc.co.uk`

## Configuration

### Vite Configuration
The `vite.config.ts` file is configured with:
- `base: '/'` for the custom domain deployment to ensure assets load correctly
- Standard React and Tailwind plugins for the build process

### GitHub Actions Workflow
The `.github/workflows/deploy-pages.yml` file contains:
- **Build job**: Installs dependencies, runs the build, and uploads the artifacts
- **Deploy job**: Uses GitHub's official actions to deploy to GitHub Pages
- **Permissions**: Configured to allow deployment to GitHub Pages
- **Trigger**: Runs on pushes to main branch and can be manually triggered

### Custom Domain Configuration
The repository is configured with a custom domain:
- **CNAME file**: Located in `public/CNAME` containing `clicker.poyningscc.co.uk`
- **PWA Manifest**: Updated with the custom domain as the start URL
- **Base Path**: Vite configured with `base: '/'` for root domain deployment

### Dependencies Replaced
To ensure the site builds and deploys correctly, the following GitHub Spark dependencies were replaced:
- **`useKV` hook**: Replaced with a localStorage-based implementation for state persistence
- **Vite plugins**: Removed GitHub Spark-specific plugins that would prevent building
- **Icon imports**: Fixed Phosphor icon imports to use correct export names

## Manual Deployment

If you need to deploy manually:

1. Make sure GitHub Pages is enabled in the repository settings
2. Go to the Actions tab in the GitHub repository
3. Find the "Deploy to GitHub Pages" workflow
4. Click "Run workflow" to trigger a manual deployment

## Local Development

The app continues to work normally in development:
```bash
npm install
npm run dev    # Development server
npm run build  # Production build
npm run preview # Preview production build
```

## Features Preserved

All original app functionality is preserved:
- ✅ Ball, over, and wicket counting
- ✅ Wide and no-ball tracking with configurable rebowl rules
- ✅ Persistent state across browser sessions (localStorage)
- ✅ Undo functionality with action history
- ✅ Over completion confirmations
- ✅ Settings management
- ✅ Mobile-friendly PWA features