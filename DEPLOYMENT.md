# Deploying to Vercel

This guide will walk you through the process of deploying both the frontend and backend of your application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) - You can sign up using your GitHub, GitLab, or Bitbucket account
2. [Vercel CLI](https://vercel.com/docs/cli) (optional, but recommended)
3. Your project must be pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Backend Deployment

### Step 1: Deploy the Backend

1. Navigate to the `server` directory
2. Make sure your backend environment variables are ready (from `.env`)
3. Deploy using one of these methods:

#### Method 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Set the root directory to `server`
5. Configure your project:
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
6. Add your environment variables under "Environment Variables" section
7. Click "Deploy"

#### Method 2: Vercel CLI
1. From the `server` directory:
   ```bash
   cd server
   vercel
   ```
2. Follow the CLI prompts

### Step 2: Note the Backend URL
After deployment, note down your backend URL (e.g., `https://your-backend.vercel.app`). You'll need this for the frontend configuration.

## Frontend Deployment

### Step 1: Update API URL
1. Update your frontend environment variables to point to the new backend URL:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

### Step 2: Deploy the Frontend

#### Method 1: Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure your project:
   - Framework Preset: Vite
   - Root Directory: `.` (project root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add your frontend environment variables
6. Click "Deploy"

#### Method 2: Vercel CLI
1. From the project root:
   ```bash
   vercel
   ```
2. Follow the CLI prompts

## Environment Variables

### Backend Environment Variables
Add these in your backend project settings in Vercel:
- All variables from your backend `.env` file

### Frontend Environment Variables
Add these in your frontend project settings in Vercel:
- All variables from your frontend `.env.production` file
- `VITE_API_URL`: Your backend Vercel deployment URL

## Vercel Configuration

Your project already includes two `vercel.json` files:

1. Root `vercel.json`: Configures frontend deployment with:
   - Build settings
   - Asset caching
   - Security headers
   - SPA routing

2. Server `vercel.json`: Configures backend deployment with:
   - Node.js serverless function settings
   - API routing
   - Security headers

## Troubleshooting

If you encounter any issues during deployment:

1. Check the build logs in Vercel dashboard
2. Verify all environment variables are correctly set in both projects
3. Ensure CORS is properly configured in the backend to allow requests from the frontend domain
4. Test the builds locally:
   ```bash
   # Backend
   cd server
   npm run build

   # Frontend
   cd ..
   npm run build
   ```

## Post-Deployment

After successful deployment:

1. Test the complete application flow using the deployed URLs
2. Set up custom domains if needed (through Vercel dashboard)
3. Monitor both frontend and backend performance in Vercel Analytics
4. Set up monitoring and alerts if required

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions) 