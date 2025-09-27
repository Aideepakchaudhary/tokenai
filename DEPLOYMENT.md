# ChainMate Deployment Guide

## Vercel Deployment (Recommended)

This project is configured for deployment on Vercel with both frontend and backend (serverless functions) running together.

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

### Step-by-Step Deployment

#### 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

#### 2. Connect Your Repository

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project"
3. Connect your Git provider (GitHub, GitLab, etc.)
4. Import your ChainMate repository
5. Vercel will auto-detect it's a Vite project

**Option B: Via CLI**
```bash
vercel
```

#### 3. Configure Environment Variables

In your Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add the following variables:

| Variable Name | Value | Description |
|---------------|--------|-------------|
| `OPENAI_API_KEY` | `sk-proj-your-key-here` | **Required** - Your OpenAI API key |
| `NODE_ENV` | `production` | Environment setting |

Optional variables:
| Variable Name | Value | Description |
|---------------|--------|-------------|
| `GRAPH_API_KEY` | `your-graph-key` | The Graph API key (uses public endpoint if not set) |

#### 4. Deploy

**Via Dashboard:**
- Click "Deploy" - Vercel will automatically build and deploy

**Via CLI:**
```bash
vercel --prod
```

#### 5. Verify Deployment

After deployment, test your endpoints:
- Frontend: `https://your-project.vercel.app`
- Health Check: `https://your-project.vercel.app/api/health`
- Portfolio API: `https://your-project.vercel.app/api/portfolio?wallet=0x...`
- Chat API: `https://your-project.vercel.app/api/chat` (POST)
- Whale API: `https://your-project.vercel.app/api/whales?token=WETH`

### Project Structure

The deployment uses:
- **Frontend**: Static React app built with Vite
- **Backend**: Serverless functions in the `/api/` folder
- **Configuration**: `vercel.json` handles routing and build settings

```
├── api/                    # Serverless functions
│   ├── health.ts          # Health check endpoint
│   ├── portfolio.ts       # Portfolio analysis API
│   ├── chat.ts            # AI chat API
│   └── whales.ts          # Whale tracking API
├── src/                   # Frontend React app
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies
```

### Troubleshooting

#### Common Issues

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript errors are resolved

2. **API Functions Don't Work**
   - Verify environment variables are set correctly
   - Check function logs in Vercel dashboard

3. **OpenAI API Errors**
   - Verify your API key is valid and has credits
   - Check the key is set correctly in environment variables

4. **CORS Issues**
   - Functions include CORS headers automatically
   - Make sure frontend calls use the correct Vercel URL

#### Debugging Steps

1. **Check Build Logs**
   - Go to Vercel Dashboard → Deployments → View Build Logs

2. **Check Function Logs**
   - Go to Vercel Dashboard → Functions → View Logs

3. **Test API Endpoints**
   - Use the browser or tools like Postman to test API endpoints directly

### Environment Variables Reference

#### Required
- `OPENAI_API_KEY`: Your OpenAI API key for chat functionality

#### Optional
- `NODE_ENV`: Set to `production` for production builds
- `GRAPH_API_KEY`: The Graph API key (uses public endpoint otherwise)

### Local Development

To run locally with the same structure:

```bash
# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev

# Or run just frontend (API functions won't work locally)
npm run dev:frontend

# Or run just the old Express backend (for testing)
npm run dev:backend
```

### Production URLs

After deployment, your URLs will be:
- **App**: `https://your-project-name.vercel.app`
- **API**: `https://your-project-name.vercel.app/api/[endpoint]`

### Custom Domains

To use a custom domain:
1. Go to Vercel Dashboard → Settings → Domains
2. Add your domain
3. Configure DNS as instructed by Vercel

### Updates and Redeployment

Vercel automatically redeploys when you push to your connected Git branch. You can also trigger manual deployments from the dashboard.

---

## Alternative: Railway Deployment

If you prefer Railway:

1. Connect your repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will auto-detect and deploy both frontend and backend

## Alternative: Traditional VPS/Server

For traditional server deployment:
1. Use PM2 or similar process manager
2. Set up nginx reverse proxy
3. Configure SSL certificates
4. Set environment variables on server

---

## Support

If you encounter issues:
1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test API endpoints individually
4. Check for TypeScript/build errors