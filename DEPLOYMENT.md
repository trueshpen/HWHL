# Deployment Guide: GitHub Pages

This guide will walk you through deploying your Wife Happiness App to GitHub Pages.

## Prerequisites

1. A GitHub account
2. Git installed on your computer
3. Your project ready to deploy

## Step-by-Step Instructions

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Name your repository (e.g., `HWHL` or `wife-happiness-app`)
5. Choose **Public** or **Private** (Private is recommended for personal apps)
6. **DO NOT** initialize with README, .gitignore, or license (since you already have these)
7. Click **Create repository**

### Step 2: Update Repository Name in Configuration

**Important:** If your repository name is different from `HWHL`, you need to update the base path:

1. Open `vite.config.js`
2. Find the line: `? '/HWHL/'`
3. Replace `HWHL` with your actual repository name
4. For example, if your repo is `wife-happiness-app`, change it to: `? '/wife-happiness-app/'`

### Step 3: Initialize Git (if not already done)

Open your terminal/command prompt in the project directory and run:

```bash
# Check if git is already initialized
git status

# If not initialized, run:
git init
```

### Step 4: Add All Files to Git

```bash
# Add all files
git add .

# Create your first commit
git commit -m "Initial commit: Wife Happiness App"
```

### Step 5: Connect to GitHub Repository

```bash
# Replace YOUR_USERNAME and YOUR_REPO_NAME with your actual GitHub username and repository name
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify the remote was added
git remote -v
```

### Step 6: Push to GitHub

```bash
# Push to main branch (or master if that's your default)
git branch -M main
git push -u origin main
```

### Step 7: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** (top menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The page will automatically refresh

### Step 8: Trigger Deployment

The GitHub Actions workflow will automatically run when you push to the main/master branch. To trigger it manually:

1. Go to the **Actions** tab in your repository
2. You should see "Deploy to GitHub Pages" workflow
3. If it hasn't run yet, click on it and click **Run workflow**

### Step 9: Access Your Website

Once deployment completes (usually takes 1-2 minutes):

1. Go back to **Settings** → **Pages**
2. You'll see your site URL, something like: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
3. Click the link to visit your site
4. You'll be prompted for the password: **190789**

## Updating Your Site

Whenever you make changes:

1. Make your changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push
   ```
3. GitHub Actions will automatically rebuild and redeploy your site
4. Wait 1-2 minutes for deployment to complete

## Troubleshooting

### Site shows 404 or blank page

- **Check repository name**: Make sure `vite.config.js` has the correct repository name in the base path
- **Check Actions**: Go to Actions tab and see if the workflow failed
- **Check build output**: Look at the build logs in Actions to see if there were any errors

### Password prompt not showing

- Clear your browser cache and cookies
- Try opening in an incognito/private window
- Check browser console for JavaScript errors

### Assets not loading

- Verify the base path in `vite.config.js` matches your repository name exactly (case-sensitive)
- Make sure the base path starts and ends with `/` (e.g., `/HWHL/`)

### Workflow fails

- Check that Node.js version in `.github/workflows/deploy.yml` is compatible
- Verify all dependencies are listed in `package.json`
- Check the Actions logs for specific error messages

## Security Note

⚠️ **Important**: The password protection is client-side only and is meant for basic development protection. For production use, consider implementing proper server-side authentication.

## Need Help?

- Check GitHub Actions logs in the **Actions** tab
- Review GitHub Pages documentation: https://docs.github.com/en/pages
- Verify your repository settings in **Settings** → **Pages**

