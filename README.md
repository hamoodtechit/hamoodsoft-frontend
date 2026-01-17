# 🚀 Hamood Tech Frontend

A modern, user-friendly, responsive web application built with Next.js 15, featuring dark/light mode, multi-language support (English & Bangla), and a clean, attractive UI.

## ✨ Features

- 🎨 **Modern UI** - Built with shadcn/ui and Tailwind CSS
- 🌓 **Dark/Light Mode** - Seamless theme switching with next-themes
- 🌍 **Multi-language** - English and Bangla support (extensible for more languages)
- 🔄 **State Management** - Zustand for client state, TanStack Query for server state
- ⚡ **Performance** - Optimized with caching, code splitting, and lazy loading
- 🛡️ **Error Handling** - Comprehensive error boundaries and API error handling
- 💀 **Skeleton Loaders** - Beautiful loading states
- ♿ **Accessible** - WCAG compliant components
- 📱 **Responsive** - Mobile-first design approach

## 🛠️ Tech Stack

### Core
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **React 18** - Latest React features

### UI & Styling
- **shadcn/ui** - High-quality component library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### State & Data
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management with caching
- **Axios** - HTTP client

### Internationalization
- **next-intl** - i18n for Next.js App Router

### Forms & Validation
- **React Hook Form** - Performant forms
- **Zod** - Schema validation

### Utilities
- **next-themes** - Dark mode support
- **sonner** - Toast notifications
- **date-fns** - Date formatting

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes
│   ├── layout.tsx         # Root layout
│   ├── loading.tsx        # Global loading
│   ├── error.tsx          # Global error boundary
│   └── not-found.tsx      # 404 page
│
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── common/           # Common components
│   └── skeletons/        # Skeleton loaders
│
├── lib/                  # Utilities & configs
│   ├── api/             # API client
│   ├── hooks/           # Custom hooks
│   ├── providers/       # React providers
│   └── utils.ts         # Utility functions
│
├── store/               # Zustand stores
├── types/               # TypeScript types
├── i18n/                # Internationalization
└── constants/           # Constants
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Hamood-Tech-Frontend
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Hamood Tech
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌍 Language Support

The application currently supports:
- **English (en)** - Default
- **Bangla (bn)** - Bengali

To add more languages:
1. Add translation file in `src/i18n/messages/[locale].json`
2. Update `src/constants/config.ts` to include the new locale

## 🎨 Theme Customization

Themes are configured in `src/styles/globals.css`. You can customize:
- Colors (primary, secondary, accent, etc.)
- Border radius
- Spacing
- Typography

## 🔐 Authentication

Authentication setup is ready with:
- Auth store (Zustand)
- API client with token interceptors
- Protected route middleware (to be implemented)

## 📦 Adding shadcn/ui Components

To add more shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
```

## 🧪 Development Guidelines

### Component Creation
- Use TypeScript for all components
- Follow the component structure in `src/components`
- Make components reusable and composable
- Use shadcn/ui as base components

### State Management
- Use Zustand for client state (UI, auth)
- Use TanStack Query for server state (API data)
- Keep state as local as possible

### API Calls
- Use TanStack Query hooks for data fetching
- Implement proper error handling
- Use caching strategies appropriately

### Styling
- Use Tailwind CSS utility classes
- Follow the design system in `tailwind.config.ts`
- Use `cn()` utility for conditional classes

## 🚧 Next Steps

- [ ] Implement authentication pages (Login/Register)
- [ ] Add protected routes middleware
- [ ] Create more reusable components
- [ ] Add form validation examples
- [ ] Implement API integration
- [ ] Add more skeleton loaders
- [ ] Setup testing (optional)

## 📄 License

This project is private and proprietary.

## 👥 Contributors

- Hamood Tech Team

---

Built with ❤️ using Next.js 15
