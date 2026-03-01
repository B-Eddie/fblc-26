# Vertex 🎓

**Connecting High School Students with Meaningful Volunteer Opportunities**

Vertex is a modern, full-featured web platform that bridges the gap between Ontario high school students who need to complete 40 hours of community service and local businesses offering volunteer opportunities. Built with cutting-edge technologies and designed for an intuitive, engaging user experience.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [How to Run](#how-to-run)
- [Project Structure](#project-structure)
- [Future Improvements](#future-improvements)

---

## 🎯 Project Overview

Vertex solves a critical need in the education system by creating a centralized platform for high school students to find, apply to, and track volunteer opportunities. The platform connects three key stakeholders:

- **Students**: Need to complete 40 community service hours for graduation
- **Businesses**: Want to engage with motivated youth and give back to their community
- **Educators**: Need to verify and track student service hours

The platform features advanced filtering, real-time applications, comprehensive rating/review systems, detailed analytics, and a beautiful, responsive interface that works seamlessly on all devices.

### Problem Solved

- **For Students**: No longer need to manually search for volunteer opportunities; instead have access to a curated list of verified opportunities from local businesses
- **For Businesses**: Can easily connect with motivated students and manage volunteer applications in one place
- **For Educators**: Can verify hours and track student progress through digital records

---

## 🌟 Features

### For Students

#### 📱 Opportunity Discovery

- **Browse Opportunities**: Advanced filtering by category (Food, Retail, Services, Healthcare, Education)
- **🔍 Smart Search**: Find opportunities by keyword, business name, or location
- **🗺️ Interactive Map**: View opportunities on an interactive map powered by Leaflet
- **⭐ Sort & Filter**: Sort by ratings, distance, or flexibility
- **❤️ Bookmarking System**: Save favorite opportunities with dedicated filter view to see only bookmarked items

#### 📊 Dashboard & Tracking

- **Comprehensive Dashboard**:
  - Visual progress charts toward 40-hour requirement
  - View application status and history
  - See personalized opportunity recommendations
  - Monitor all bookmarked opportunities
- **Hours Tracking**: Real-time updates on volunteer hours completed
- **Application History**: View all submitted applications and their statuses

#### ⚡ Application & Engagement

- **One-Click Apply**: Quick application process with minimal friction
- **⭐ Rate & Review**: Leave detailed feedback and star ratings for businesses
- **Email Notifications**: Stay updated on application status changes
- **Digital Profile**: Formal representation of volunteer history and achievements

#### 🔐 Account Management

- **Email Verification**: Secure authentication with email verification
- **Role-Based Access**: Student-specific features and permissions
- **Profile Customization**: Personalize your profile and preferences

### For Businesses

#### 📝 Opportunity Management

- **Post Opportunities**: Create volunteer positions with:
  - Detailed descriptions and requirements
  - Flexible vs. fixed hours options
  - Special perks and benefits
  - Category assignment
  - Image uploads
- **Opportunity Analytics**: Track views, applications, and engagement
- **Bulk Operations**: Manage multiple opportunities efficiently

#### 💼 Application & Student Management

- **Application Dashboard**: Review, accept, and respond to student applications
- **Candidate Profiles**: Browse approved volunteer applicants with full history
- **Application Tracking**: Monitor application pipeline and trends
- **Communication**: Direct messaging with potential volunteers

#### 🎯 Business Profile & Marketing

- **Business Profile**: Showcase business information, values, and mission
- **Rating & Review System**: Receive feedback from students and build reputation
- **⭐ Coupon Management**: Create and manage special offers for students
- **Analytics Dashboard**: Detailed insights into opportunity performance

#### 👥 Engagement Tools

- **Student Directory**: Browse and search through approved volunteers
- **Feedback Management**: Respond to reviews and ratings
- **Engagement Metrics**: See trends in applications and bookmarks

### Platform-Wide Features

- **🔐 Secure Authentication**: Supabase auth with role-based access control
- **🎨 Beautiful, Modern UI**: Responsive design with smooth animations and transitions
- **📱 Mobile Responsive**: Fully functional on desktop, tablet, and mobile devices
- **🌙 Dark Theme**: Optimized for comfortable viewing in any lighting
- **⚡ Fast Performance**: Optimized loading and rendering for smooth experience
- **🔄 Real-time Updates**: Live data synchronization across all sessions
- **♿ Accessible Design**: Keyboard navigation and screen reader support

---

## 🚀 Technologies Used

### Frontend Stack

- **Next.js 14** - React framework with App Router for modern, optimized web development
- **React 18** - UI library with latest hooks and concurrent features
- **TypeScript 5.3** - Type-safe JavaScript for better code quality
- **Tailwind CSS 3.4** - Utility-first CSS framework for rapid UI development

### Animations & Graphics

- **Framer Motion** - Production-ready animation library for React
- **GSAP** - Advanced animations and complex sequences
- **Three.js** - 3D graphics for shader animations

### Data & Visualization

- **Recharts 2.10** - Composable React components for data visualization
- **React Leaflet 4.2** - React bindings for Leaflet mapping library
- **Leaflet 1.9.4** - Open-source mapping library

### Backend & Database

- **Supabase** - Open-source Firebase alternative built on PostgreSQL
- **PostgreSQL** - Robust relational database
- **Supabase Auth** - User authentication and authorization
- **Row Level Security (RLS)** - Database-level access control

### Additional Libraries

- **PDF-Lib 1.17** - PDF generation and document manipulation
- **React Google reCAPTCHA 3.1** - Bot protection and spam prevention
- **Lucide React** - Beautiful, consistent icon library
- **Framer Motion** - Animation and interaction library
- **Tailwind Merge** - Intelligent class name merging
- **CLSX** - Conditional className utility

### Development & Tooling

- **ESLint** - Code quality and consistency checking
- **Autoprefixer** - Automatic CSS vendor prefix management
- **PostCSS** - CSS transformation and optimization

---

## 📦 Setup Instructions

### Prerequisites

Before getting started, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase account** (free tier available at [supabase.com](https://supabase.com))
- **Google reCAPTCHA** account (free at [google.com/recaptcha](https://www.google.com/recaptcha/admin))

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd fblc-26
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

### Step 3: Create Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google reCAPTCHA (Optional but recommended)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

**Where to find these values:**

1. **Supabase URL & Key:**
   - Go to [Supabase Console](https://app.supabase.com)
   - Create a new project or select existing one
   - Navigate to Settings > API
   - Copy the Project URL and `anon` key

2. **reCAPTCHA Key:**
   - Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Create a new site (reCAPTCHA v3)
   - Add `localhost:3000` as a domain
   - Copy the Site Key

### Step 4: Set Up the Database

1. In Supabase console, navigate to **SQL Editor**
2. Create a new query and run each migration file in order:
   - `supabase-migrations/add_opportunity_image_url.sql`
   - `supabase-migrations/add_application_fields_and_custom_questions.sql`

These migrations set up the required tables and relationships.

### Step 5: Configure Authentication

1. In Supabase console, go to **Authentication > Providers**
2. Ensure **Email** provider is enabled (default)
3. Go to **Authentication > URL Configuration**
4. Add your localhost and production URLs:
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback`
   - Site URL: `http://localhost:3000` or your production domain

### Step 6: Verify Installation

```bash
npm run build
```

If the build succeeds without errors, you're all set!

---

## 🏃 How to Run

### Development Server

Start the development server with hot-reload:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The page will reload when you make changes.

**Features enabled in development:**

- Hot module reloading
- Detailed error messages
- Source maps for debugging
- Development-only error overlays

### Production Build

Build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Start Production Server

After building, start the production server:

```bash
npm start
```

The server will run on [http://localhost:3000](http://localhost:3000) in production mode.

### Run Linting

Check code quality:

```bash
npm run lint
```

Fix common linting issues:

```bash
npm run lint -- --fix
```

### Other Useful Commands

**Development with debugging:**

```bash
npm run dev -- --inspect
```

**Build with profiling:**

```bash
npm run build -- --profile
```

---

## 📁 Project Structure

```
fblc-26/
├── app/                                    # Next.js App Router
│   ├── page.tsx                           # Landing page
│   ├── layout.tsx                         # Root layout with providers
│   ├── globals.css                        # Global styles
│   ├── auth/                              # Authentication pages
│   │   ├── login/page.tsx                 # Login page
│   │   ├── signup/page.tsx                # Registration page
│   │   └── verify-email/page.tsx          # Email verification
│   ├── browse/                            # Opportunity browsing
│   │   ├── page.tsx                       # Main opportunities list with filters
│   │   └── businesses/page.tsx            # Business listing page
│   ├── dashboard/                         # Student dashboard
│   │   ├── page.tsx                       # Main dashboard with stats
│   │   └── job/[id]/page.tsx              # Job detail in dashboard context
│   ├── opportunities/                     # Opportunity details
│   │   └── [id]/
│   │       ├── page.tsx                   # Opportunity detail page
│   │       └── apply/page.tsx             # Application submission
│   └── business/                          # Business portal
│       ├── dashboard/page.tsx             # Business dashboard
│       ├── setup/page.tsx                 # Business onboarding
│       ├── opportunities/
│       │   ├── new/page.tsx               # Create new opportunity
│       │   └── [id]/edit/page.tsx         # Edit opportunity
│       └── employee/[id]/page.tsx         # Employee management
├── components/                            # Reusable React components
│   ├── OpportunityCard.tsx                # Opportunity card with bookmarking
│   ├── BusinessCard.tsx                   # Business card component
│   ├── BusinessFavoriteButton.tsx         # Favorite button for businesses
│   ├── RatingSubmissionForm.tsx           # 5-star rating & review form
│   ├── OpportunityMap.tsx                 # Interactive Leaflet map
│   ├── HoursProgressChart.tsx             # Hours progress visualization
│   ├── CouponsDisplay.tsx                 # Coupon listing component
│   ├── PDFSigner.tsx                      # Digital signature pad
│   ├── SignaturePad.tsx                   # Signature drawing component
│   ├── RecaptchaProvider.tsx              # reCAPTCHA wrapper
│   ├── CaptchaVerification.tsx            # Captcha UI component
│   ├── AnimatedContainer.tsx              # Animated wrapper component
│   └── ui/                                # Specialized UI components
│       ├── hero-landing-page.tsx          # Hero section for landing
│       └── shader-animation.tsx           # Three.js shader animations
├── lib/                                   # Utilities and helpers
│   ├── supabase.ts                        # Supabase client initialization
│   └── utils.ts                           # Helper functions and utilities
├── types/                                 # TypeScript type definitions
│   └── database.ts                        # Database schema types
├── public/                                # Static assets
│   └── image.png                          # Logo and branding
├── supabase-migrations/                   # Database migrations
│   ├── add_opportunity_image_url.sql
│   └── add_application_fields_and_custom_questions.sql
├── tailwind.config.ts                     # Tailwind CSS configuration
├── tsconfig.json                          # TypeScript configuration
├── next.config.mjs                        # Next.js configuration
├── postcss.config.mjs                     # PostCSS configuration
├── components.json                        # Component library config
├── package.json                           # Dependencies and scripts
├── next-env.d.ts                          # Next.js type definitions
├── FEATURES_IMPLEMENTED.md                # Feature documentation
├── SETUP_GUIDE.md                         # Detailed setup instructions
├── QUICKSTART.md                          # Quick start guide
└── README.md                              # This file
```

### Key Files Explained

- **`app/`** - Contains all page components using Next.js App Router
- **`components/`** - Reusable components shared across pages
- **`lib/supabase.ts`** - Supabase client configuration and initialization
- **`types/database.ts`** - TypeScript types generated from Supabase schema
- **`public/`** - Static files served directly to the browser

---

## 🔄 Key Features Explained

### Bookmarking System

Users can bookmark opportunities they're interested in and use a dedicated filter to show only bookmarked items. Bookmarks are stored in the Supabase database and persist across sessions.

**How it works:**

1. Click the bookmark icon on any opportunity card
2. The heart icon fills when bookmarked
3. Filter by "Bookmarks" to see only saved opportunities
4. Bookmarks sync across all devices when logged in

### Rating & Review System

Students can leave 1-5 star ratings and written reviews for businesses. Reviews are displayed on business profiles and influence sorting/recommendations.

**Features:**

- 5-star rating system with hover preview
- Optional written review field (up to 500 characters)
- Edit existing ratings
- View all reviews for a business
- Average rating calculation

### Hours Tracking

Students can view their progress toward the 40-hour requirement with visual progress charts, hour breakdowns, and personalized recommendations.

### Opportunity Matching

The system intelligently filters and sorts opportunities based on:

- Student interests and preferences
- Opportunity requirements and prerequisites
- Flexibility (fixed hours vs. flexible)
- Business ratings and community feedback
- Geographic distance from student

---

## 🗄️ Database Schema Overview

### Core Tables

**profiles** - User accounts

- id, email, full_name, role (student|business), email_verified, created_at

**businesses** - Business information

- id, profile_id, name, description, category, city, latitude, longitude, image_url, ratings, created_at

**opportunities** - Volunteer listings

- id, business_id, title, description, hours_available, is_flexible, requirements, perks, image_url, created_at

**applications** - Student applications

- id, opportunity_id, profile_id, message, status (pending|accepted|rejected), created_at

**bookmarks** - Saved opportunities

- id, profile_id, opportunity_id, created_at

**ratings** - Reviews and ratings

- id, profile_id, business_id, rating (1-5), review, created_at

**coupons** - Special offers

- id, business_id, code, discount, description, is_active, created_at

---

## 🚀 Future Improvements

### 🤖 AI & Machine Learning

- **AI Recommendations**: Machine learning-based opportunity suggestions based on student profile and history
- **Smart Matching**: Advanced algorithms to match students with best-fit opportunities
- **Predictive Analytics**: Forecast student hours completion and engagement trends
- **NLP for Content**: Auto-categorize and tag opportunities using natural language processing

### 📱 Mobile & Native Apps

- **iOS App**: Native iOS application for better mobile experience
- **Android App**: Native Android application
- **PWA Support**: Progressive Web App with offline capabilities
- **Push Notifications**: Real-time alerts for new opportunities and applications
- **App Store Distribution**: Deploy to Apple App Store and Google Play Store

### 🔔 Communications

- **Messaging System**: Direct messaging between students and businesses
- **Email Notifications**: Customizable email alerts for applications and updates
- **SMS Notifications**: Text message alerts for urgent updates
- **Notification Preferences**: Granular control over notification settings

### 🎓 Certification & Verification

- **Digital Certificates**: Earn shareable digital certificates for completed hours
- **Credential System**: Blockchain-based verification of hours
- **Resume Integration**: Export achievements to resume builders
- **School Integration**: Direct integration with school systems for hour verification

### 📊 Advanced Analytics

- **Business Analytics**: Detailed insights and reporting dashboards
- **Student Performance**: Progress tracking with predictive analysis
- **Engagement Metrics**: Track engagement rates and trends
- **ROI Tracking**: Measure business impact of volunteer programs
- **Custom Reports**: Generate custom analytics reports

### 🌐 Internationalization

- **Multi-language Support**: Support for French, Spanish, and other languages
- **Localization**: Region-specific content and opportunities
- **Currency Support**: Multiple currency options
- **Regional Compliance**: Adapt to regional laws and regulations

### ♿ Accessibility Enhancements

- **WCAG 2.1 AAA Compliance**: Full accessibility standards compliance
- **Screen Reader Optimization**: Enhanced support for assistive technologies
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes
- **Font Sizing**: User-adjustable text sizes

### 🎮 Gamification

- **Achievement Badges**: Earn badges for milestones
- **Leaderboards**: Community achievements leaderboard
- **Streaks**: Track consecutive volunteering streaks
- **Points System**: Earn points for activities (redeemable or for status)
- **Challenges**: Participate in time-limited volunteering challenges

### 📸 Media & Content

- **Photo Gallery**: Opportunity and business photo galleries
- **Video Testimonials**: Student and business testimonial videos
- **Virtual Tours**: 360-degree business location tours
- **Live Events**: Live streaming of volunteer events

### 🔐 Enhanced Security

- **Two-Factor Authentication**: 2FA option for user accounts
- **Biometric Login**: Fingerprint/Face ID support
- **Advanced Fraud Detection**: ML-based fraud prevention
- **Security Audit Logging**: Detailed audit trails
- **GDPR Compliance**: Full GDPR compliance and data handling

### 🎨 UI/UX Improvements

- **Multiple Themes**: User-selectable light/dark themes
- **Customizable Colors**: Theme customization options
- **Accessibility Settings**: Enhanced accessibility options
- **Lazy Loading**: Improved loading performance
- **Image Optimization**: Automatic image optimization and CDN

### ⚡ Performance & Infrastructure

- **Caching Strategy**: Advanced caching for faster loads
- **CDN Integration**: Global content delivery network
- **Image Optimization**: Automatic image resizing and optimization
- **Code Splitting**: Advanced code splitting for faster initial loads
- **Database Optimization**: Query optimization and indexing

### 🧪 Developer Experience

- **API Documentation**: OpenAPI/Swagger documentation
- **Component Storybook**: Interactive component library
- **Testing Suite**: Comprehensive unit, integration, and E2E tests
- **Error Handling**: Better error messages and logging
- **CI/CD Pipeline**: Automated testing and deployment
- **Developer Guides**: Comprehensive documentation for developers

### 🤝 Community Features

- **User Messaging**: Direct user-to-user messaging
- **Community Forums**: Discussion forums for students and businesses
- **Event Calendar**: Community event calendar
- **Success Stories**: Feature student and business success stories
- **Blog/News**: News and educational content

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork the repository**

```bash
git clone https://github.com/yourusername/fblc-26.git
cd fblc-26
```

2. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

3. **Commit your changes**

```bash
git commit -m 'Add descriptive message about your feature'
```

4. **Push to the branch**

```bash
git push origin feature/your-feature-name
```

5. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Include before/after screenshots if applicable

### Coding Standards

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add comments for complex logic
- Test changes before submitting PR
- Update documentation if needed

---

## 📄 License

This project is maintained by the Vertex team and is currently private.

---

## 📧 Support & Contact

For support, questions, or feedback:

- **Email**: [contact email]
- **Issues**: Create an issue in the repository
- **Discussions**: Use GitHub Discussions for general questions

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Database and authentication
- [Tailwind CSS](https://tailwindcss.com/) - Utility CSS framework
- [Leaflet](https://leafletjs.com/) - Mapping library
- [Lucide](https://lucide.dev/) - Icon library
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [React](https://react.dev/) - UI library

---

<div align="center">

**Made with ❤️ for Ontario high school students seeking meaningful volunteer opportunities**

[Report Bug](../../issues) · [Request Feature](../../issues) · [Documentation](./SETUP_GUIDE.md)

</div>
