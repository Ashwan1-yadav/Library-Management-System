# 📚 Library Management System (LMS)

A modern, open-source Library Management System built with React and Supabase. Features a mobile-native feel with responsive web design, real-time search, barcode scanning, and automated fine calculation.

## ✨ Features

- **Dashboard** — Real-time stats (books, members, active borrows, unpaid fines), quick actions, and recent borrows feed
- **Book Management** — Full CRUD with cover image upload (URL or file), ISBN barcode scanner via camera, paginated grid view
- **Member Management** — Add/edit/search members with paginated table view
- **Borrow & Return** — Create borrows with due dates, one-click return with auto-calculated late fines (₹10/day), real-time stock updates
- **Fine Management** — Track unpaid fines, mark as paid, filter by status
- **Reports & Analytics** — Pie chart (books by genre), bar chart (monthly borrows), top 5 most borrowed books — all exportable to CSV
- **Authentication** — Email/password sign-up and sign-in via Supabase Auth, protected routes
- **Admin Profile** — Avatar upload, profile management
- **Dark Mode** — Full light/dark theme toggle with persistent preference
- **Mobile-Native UI** — iOS-style bottom sheet for forms, bottom tab navigation, swipe gestures, floating action buttons
- **Responsive Design** — Professional sidebar layout on desktop, bottom tabs on mobile

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + React Router 7 + Vite 8 |
| **Styling** | Vanilla CSS (CSS custom properties, 3300+ lines, light/dark themes) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Row-Level Security) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Barcode** | html5-qrcode (ISBN scanner) |
| **Linting** | Oxlint (Rust-based) |

## 📦 Installation

### Prerequisites

- Node.js >= 18
- A Supabase project ([free tier](https://supabase.com))

### Setup

```bash
git clone <https://github.com/Ashwan1-yadav/Library-Management-System.git>
cd Library-Management-System
npm install
```

Copy the environment template and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Database Setup

1. Go to your Supabase project's **SQL Editor**
2. Run the contents of [`supabase-schema.sql`](./supabase-schema.sql) — this creates all tables, indexes, RLS policies, triggers, and the storage bucket
3. If you encounter storage upload errors, run [`fix-storage-policies.sql`](./fix-storage-policies.sql)

### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Register a new account to get started.

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `books` | Book catalog with title, author, ISBN, genre, quantity tracking |
| `members` | Library patrons with contact details |
| `borrows` | Borrowing records with status tracking |
| `fines` | Late-return fine records |
| `admin_profiles` | Extended admin profile linked to auth users |

### Key Behaviors

- **Triggers** automatically update `available_quantity` on borrow/return
- **RLS** allows full CRUD for any authenticated user on all tables
- **Storage bucket** `book-covers` is publicly readable for cover images

## 📁 Project Structure

```
src/
├── main.jsx                 # React entry point
├── App.jsx                  # Router (public + protected routes)
├── index.css                # Complete stylesheet (~3300 lines)
├── lib/
│   ├── supabase.js          # Supabase client
│   └── AuthContext.jsx      # Auth provider (signIn, signUp, signOut, profile)
├── components/
│   ├── BottomSheet.jsx      # iOS drag-dismiss sheet + desktop Modal
│   ├── Fab.jsx              # Floating action button
│   ├── Layout.jsx           # App shell (sidebar, navbar, tabs, notifications)
│   ├── ProtectedRoute.jsx   # Auth guard
│   └── Toast.jsx            # Toast notifications
└── pages/
    ├── Landing.jsx          # Public marketing page
    ├── Login.jsx            # Sign in / Register
    ├── Dashboard.jsx        # Stats + recent activity
    ├── Books.jsx            # Book catalog (grid, search, paginate)
    ├── BookDetail.jsx       # Single book view
    ├── BookForm.jsx         # Add/Edit book (ISBN scanner)
    ├── Members.jsx          # Member list
    ├── MemberForm.jsx       # Add/Edit member
    ├── BorrowReturn.jsx     # Borrow/return with fines
    ├── Fines.jsx            # Fine tracking
    ├── Reports.jsx          # Charts + CSV export
    └── AdminProfile.jsx     # Profile management
```

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT
