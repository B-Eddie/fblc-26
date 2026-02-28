# Vertex Setup Guide 🚀

This guide will help you set up and run the Vertex application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works great)
- Git (optional, for version control)

## Step 1: Install Dependencies ✅

Dependencies are already installed! If you need to reinstall:

```bash
cd /Users/eddieb/Coding_Projects/fblc/fblc
npm install
```

## Step 2: Configure Supabase 🗄️

### 2.1 Database Setup

1. Go to your Supabase project dashboard: https://ybgunqbbbwusedkuftbc.supabase.co

2. Navigate to the SQL Editor

3. Copy and paste the entire contents of `supabase-schema.sql`

4. Click "Run" to create all tables, policies, and indexes

5. If your database was created before the opportunity image feature was added, run the migration to add the image column:
   - Open **SQL Editor** again and run the contents of `supabase-migrations/add_opportunity_image_url.sql` (or run: `ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS image_url TEXT;`)

### 2.2 Authentication Setup

1. In Supabase dashboard, go to Authentication > Settings
2. Ensure Email auth is enabled
3. Configure email templates if desired (optional)

### 2.3 Storage Setup (Optional)

For business and opportunity images:

1. Go to **Storage** in the Supabase dashboard.
2. Create a bucket named **`opportunity-images`** (for opportunity listing images).
3. Set the bucket to **Public** so marketplace cards can show images.
4. Under **Policies**, add a policy to allow authenticated uploads (e.g. "Allow authenticated users to INSERT" with `bucket_id = 'opportunity-images'`).
5. If you use business profile images, create a bucket **`business-images`** and set it to public.

## Step 3: Environment Variables ✅

Your `.env.local` file is already configured with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ybgunqbbbwusedkuftbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: Keep this file secure and never commit it to version control!

## Step 4: Run the Development Server 🏃

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

## Step 5: Seed Sample Data (Optional) 📊

To test the app with sample data:

1. Create a business account at http://localhost:3000/auth/signup?role=business
2. Set up a business profile with:
   - Business name
   - Address and location (use Toronto coordinates: 43.6532, -79.3832)
   - Category (e.g., Food, Retail, Services)
3. Create some volunteer opportunities
4. Create a student account at http://localhost:3000/auth/signup
5. Browse and apply to opportunities

### Sample Business Data

Here are some sample coordinates in Toronto you can use:

- **Downtown Toronto**: 43.6532, -79.3832
- **Scarborough**: 43.7764, -79.2318
- **North York**: 43.7615, -79.4111
- **Etobicoke**: 43.6435, -79.5656
- **East York**: 43.6890, -79.3381

## Step 6: Build for Production 🏗️

When you're ready to deploy:

```bash
npm run build
npm start
```

## Project Structure 📁

```
fblc/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Home page
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles
│   ├── auth/                # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── browse/              # Browse opportunities
│   ├── dashboard/           # Student dashboard
│   ├── business/            # Business pages
│   │   └── dashboard/
│   └── opportunities/       # Opportunity details
│       └── [id]/
├── components/              # React components
│   ├── OpportunityCard.tsx
│   └── OpportunityMap.tsx
├── lib/                     # Utilities
│   └── supabase.ts          # Supabase client
├── types/                   # TypeScript types
│   └── database.ts          # Database types
├── public/                  # Static assets
├── .env.local              # Environment variables
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
└── package.json            # Dependencies
```

## Features Overview 🌟

### Student Features
- Browse and search opportunities
- Filter by category and location
- View opportunities on an interactive map
- Apply to opportunities with one click
- Track volunteer hours
- Bookmark favorite opportunities
- Rate and review businesses

### Business Features
- Create and manage business profile
- Post volunteer opportunities
- Review and manage applications
- Accept/reject applicants
- View analytics and stats

## Common Issues & Solutions 🔧

### Issue: Map not displaying

**Solution**: Make sure Leaflet CSS is imported in `app/globals.css`:
```css
@import 'leaflet/dist/leaflet.css';
```

### Issue: Authentication not working

**Solution**: 
1. Check that Supabase URL and keys are correct in `.env.local`
2. Verify email auth is enabled in Supabase dashboard
3. Check browser console for errors

### Issue: Database errors

**Solution**:
1. Ensure all tables are created (run `supabase-schema.sql`)
2. Check Row Level Security policies are enabled
3. Verify foreign key relationships

### Issue: Build errors

**Solution**:
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

## Deployment 🚀

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel settings
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up continuous deployment
- Provide a production URL

### Deploy to Other Platforms

The app can also be deployed to:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

Just ensure you set the environment variables correctly!

## Next Steps 🎯

1. **Customize Branding**: Update colors, logo, and text
2. **Add Features**: Email notifications, advanced search, etc.
3. **Improve SEO**: Add meta tags, sitemap, robots.txt
4. **Add Analytics**: Google Analytics, Plausible, etc.
5. **Test**: Write tests for components and pages
6. **Get Feedback**: Show to real students and businesses

## Support 💬

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase logs
3. Check network requests in DevTools
4. Ensure all dependencies are installed

## Resources 📚

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Happy coding! 🎉**

Made with ❤️ for Ontario high school students
