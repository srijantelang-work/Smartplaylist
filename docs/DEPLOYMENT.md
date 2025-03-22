# Deployment Guide for SmartPlaylist

This guide explains how to set up and deploy the SmartPlaylist application using Vercel and GitHub Actions.

## Prerequisites

- GitHub account with admin access to the repository
- Node.js 18 or later installed locally
- npm package manager

## 1. Vercel Setup

### 1.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended) or create a new account
4. Follow the onboarding process

### 1.2 Install Vercel CLI
Open your terminal and run:
```bash
npm install -g vercel
```

### 1.3 Login to Vercel CLI
```bash
vercel login
```
Follow the prompts to complete the authentication process.

### 1.4 Link Your Project
```bash
cd smartplaylist
vercel link
```
This will create a `.vercel` directory in your project with the necessary configuration.

## 2. GitHub Repository Secrets

Navigate to your GitHub repository settings:
1. Go to "Settings" > "Secrets and variables" > "Actions"
2. Click "New repository secret"
3. Add the following secrets:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `VERCEL_TOKEN` | Deployment token for Vercel | 1. Go to Vercel Account Settings<br>2. Navigate to Tokens<br>3. Create new token with "Full Account" scope |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Copy from your Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Copy from your Supabase project settings |
| `VITE_GROQ_API_KEY` | GROQ API key | Copy from your GROQ dashboard |
| `VITE_APP_URL` | Production URL | Will be provided by Vercel after first deployment |

## 3. Initial Deployment

Run your first deployment:
```bash
vercel
```

Follow the prompts:
- Select scope (your account)
- Confirm project settings
- Choose deployment type (usually "Production")

After deployment completes, copy the production URL and add it as `VITE_APP_URL` in your GitHub secrets.

## 4. CI/CD Pipeline

The configured CI/CD pipeline (`ci.yml`) includes:

### Build Job
- Runs on every push and pull request
- Steps:
  1. Checkout code
  2. Setup Node.js environment
  3. Install dependencies
  4. Run linting
  5. Build the application
  6. Cache build artifacts

### Deploy Job
- Runs only on pushes to main branch
- Requires successful build job
- Steps:
  1. Install Vercel CLI
  2. Pull environment information
  3. Build project artifacts
  4. Deploy to production

## 5. Vercel Configuration

The `vercel.json` configuration includes:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

This configuration:
- Specifies Vite as the framework
- Sets build and install commands
- Configures routing for single-page application
- Ensures proper static file serving

## 6. Monitoring and Maintenance

### 6.1 Deployment Status
- Monitor deployments in Vercel Dashboard
- Check GitHub Actions tab for CI/CD pipeline status

### 6.2 Environment Variables
- Update environment variables in both:
  - GitHub repository secrets
  - Vercel project settings

### 6.3 Troubleshooting
If deployment fails:
1. Check GitHub Actions logs
2. Verify all secrets are properly set
3. Ensure build process succeeds locally
4. Check Vercel deployment logs

## 7. Security Considerations

- Never commit sensitive information to the repository
- Regularly rotate API keys and tokens
- Review GitHub repository access permissions
- Monitor Vercel deployment logs for security issues

## 8. Best Practices

1. Always test changes locally before pushing
2. Use feature branches and pull requests
3. Review deployment logs after each deployment
4. Keep dependencies updated
5. Monitor application performance in Vercel analytics

## Support

For issues related to:
- Vercel: [Vercel Support](https://vercel.com/support)
- GitHub Actions: [GitHub Support](https://support.github.com)
- Supabase: [Supabase Support](https://supabase.com/support) 