# Vertex 🎓

**Connecting High School Students with Meaningful Volunteer Opportunities**

Vertex is a web platform that bridges the gap between Ontario high school students who need to complete 40 hours of community service and local businesses offering volunteer opportunities.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## 🌟 Features

### For Students
- **Browse Opportunities**: Filter by category (Food, Retail, Services, Healthcare, Education)
- **Smart Search**: Find opportunities by keyword, business name, or location
- **Interactive Map**: View opportunities on a map powered by Leaflet
- **Sort & Filter**: Sort by ratings, distance, or flexibility
- **Track Hours**: Dashboard to monitor your volunteer hours progress
- **Save Favorites**: Bookmark opportunities for later
- **One-Click Apply**: Quick application process
- **Rate & Review**: Leave feedback for businesses

### For Businesses
- **Post Opportunities**: Create volunteer positions with detailed descriptions
- **Manage Applications**: Review and respond to student applications
- **Track Engagement**: See analytics on your opportunities
- **Build Community**: Connect with motivated students

## 🚀 Tech Stack

- **Frontend**: React, Next.js 14, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Maps**: Leaflet & React-Leaflet
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fblc
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ybgunqbbbwusedkuftbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

4. **Set up the database**

Run the SQL schema in your Supabase project:
```bash
# Copy the contents of supabase-schema.sql and run in Supabase SQL editor
```

5. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

The application uses the following main tables:
- **profiles**: User accounts (students & businesses)
- **businesses**: Business information and locations
- **opportunities**: Volunteer positions
- **applications**: Student applications to opportunities
- **bookmarks**: Saved opportunities
- **ratings**: Business ratings and reviews

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## 🗺️ Usage

### Students

1. **Sign Up**: Create an account as a student
2. **Browse**: Explore volunteer opportunities in your area
3. **Apply**: Submit applications with a personal message
4. **Track**: Monitor your hours in the dashboard
5. **Review**: Rate businesses after completing hours

### Businesses

1. **Sign Up**: Create an account as a business
2. **Create Profile**: Set up your business with location and details
3. **Post**: Create volunteer opportunity listings
4. **Manage**: Review applications and accept/reject students
5. **Track**: See analytics on your opportunities

## 🎨 Key Pages

- **`/`** - Landing page with features and benefits
- **`/browse`** - Browse all opportunities with filters and map
- **`/dashboard`** - Student dashboard with hours tracking
- **`/business/dashboard`** - Business dashboard for managing opportunities
- **`/opportunities/[id]`** - Detailed opportunity view
- **`/auth/login`** - Login page
- **`/auth/signup`** - Registration page

## 🔐 Authentication

Authentication is handled by Supabase Auth with email/password. The app supports two user roles:
- **Student**: Can browse, apply, and track hours
- **Business**: Can post opportunities and manage applications

## 🌍 Map Integration

The app uses Leaflet for displaying opportunities on an interactive map. Businesses provide their location coordinates when creating their profile, and students can visualize opportunities geographically.

## 📈 Analytics

Students can track:
- Total volunteer hours completed
- Progress toward 40-hour goal
- Application status
- Saved opportunities

Businesses can track:
- Number of active opportunities
- Total applications received
- Pending application reviews

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database & Auth by [Supabase](https://supabase.com/)
- Maps by [Leaflet](https://leafletjs.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for Ontario high school students seeking meaningful volunteer opportunities**
