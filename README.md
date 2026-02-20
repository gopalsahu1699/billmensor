# BillMensor

BillMensor is a modern, premium web application built for seamless transactional management and AI-assisted data processing. Equipped with a sleek dashboard UI (Stitch UI), it offers comprehensive tools for handling invoices, purchases, returns, and payments alongside powerful WhatsApp bot integration powered by NVIDIA AI.

## 🚀 Features

- **End-to-End Transaction Management**: Effortlessly handle Sales Invoices, Purchase Bills, Sales Returns, Purchase Returns, Payments-In, and Payments-Out.
- **Premium Dashboard UI**: Designed with consistency and aesthetics in mind. Features "Studio" style headers, standardized forms, and seamless dark mode support.
- **NVIDIA AI Integration**: Fully integrated AI (powered by `meta/llama-3.1-70b-instruct`) for automated data cleaning, normalization, and an intelligent WhatsApp bot.
- **AI Training Center**: Customize AI behavior with specific rules and examples for highly accurate automated data imports.
- **Advanced Print & Export**: A4-optimized, pixel-perfect document generation for quotations and sales invoices using `html-to-image` and `jspdf`.
- **WhatsApp Bot & Widget**: A streamlined "Book Demo" chat widget and daily bulk messaging capabilities to engage with clients seamlessly.
- **Cloud Database (Supabase)**: Secure, scalable data management synchronized perfectly with frontend schemas.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Database**: [Supabase](https://supabase.com/)
- **Document Generation**: `html-to-image`, `jspdf`
- **AI & Integrations**: NVIDIA AI (Llama 3.1 70B), WhatsApp Bot 
- **Deployment**: Vercel / Railway

## ⚙️ Getting Started

### Prerequisites

- Node.js (>= 20.x.x recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up your environment variables. Create a `.env.local` file in the root directory and add your Supabase, NVIDIA AI, and WhatsApp credentials.

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure Highlights

- `app/`: Next.js 15 App Router pages and layouts.
- `components/`: Reusable, styled React components (forms, modals, print layouts).
- `supabase_schema.sql`: Core database schema definition.

## 🎨 Design System

BillMensor utilizes the **Stitch UI** design language. It focuses on clean typography, distinct table-based data grids, and accessible interaction patterns, ensuring an enterprise-grade experience without feeling heavy or outdated.
