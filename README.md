# Profissão Laser

A business management platform for laser/aesthetic professionals. Built with Next.js, it provides a dashboard to manage products, courses, subscriptions, sales, coupons, and affiliates.

## Tech Stack

- **Framework:** Next.js 16 (App Router, standalone output)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database/Auth:** Supabase
- **Data Fetching:** TanStack React Query + Axios
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Validation:** Zod
- **Linter/Formatter:** Biome
- **Git Hooks:** Husky + lint-staged

## Features

- **Dashboard** — stats overview, quick access, alerts, and chat button
- **Products** — list, search, and manage courses/products; add new courses via modal
- **Courses** — view active subscriptions and access course content by slug
- **Subscriptions** — create and manage customer subscription plans
- **Coupons** — coupon management
- **Sales** — sales tracking
- **Reports** — business reports
- **Affiliates** — partner/affiliate management

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Dashboard
│   ├── products/     # Products listing and detail
│   └── course/       # Course listing and content
├── components/
│   ├── dashboard/    # Dashboard UI components
│   └── products/     # Product/course UI components
├── hooks/            # React Query data hooks
├── services/         # API service functions
├── lib/              # Supabase client, fetch helpers
├── types/            # TypeScript type definitions
└── utils/            # Constants and format helpers
```

## Getting Started

### Prerequisites

- Node.js 22+
- A Supabase project

### Environment Variables

Create a `.env.local` file at the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=your_api_url
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Lint and auto-fix with Biome |

## Docker

Build and run the production image:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  --build-arg NEXT_PUBLIC_API_URL=your_api_url \
  -t profissao-laser .

docker run -p 3000:3000 profissao-laser
```

The Dockerfile uses a multi-stage build (deps → builder → runner) with a non-root `nextjs` user.
