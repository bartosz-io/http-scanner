# HTTP Scanner

A modern web application for scanning and analyzing HTTP security headers of websites, following OWASP Secure Headers Project recommendations.

## 🚀 Features

- **Quick Security Analysis**: Scan any public website for security headers in seconds
- **Comprehensive Scoring**: Get a 0-100 security score based on weighted rules
- **Detailed Reports**: View detected headers, missing headers, and leaking headers
- **Shareable Results**: Each scan generates a unique URL with shareable image for social media

## 🛠️ Tech Stack

### Frontend
- Astro 7 static pages with React 19 islands
- TypeScript 5 and Vite-powered development
- Tailwind CSS 4 + shadcn/ui components
- Normal document routes with a compatibility redirect for legacy hash URLs

### Backend
- Cloudflare Workers (TypeScript)
- Cloudflare Workers Static Assets
- Cloudflare Email Service for transactional lead notifications
- Clean Architecture principles

### Storage
- Cloudflare D1 (serverless SQLite) for reports
- Cloudflare R2 for storing share images

## 🔧 Development

### Prerequisites
- Node.js (LTS version)
- npm or yarn
### Setup

```bash
# Clone the repository
git clone https://github.com/bartosz-io/http-scanner.git
cd http-scanner

# Install dependencies
npm install

# Terminal 1: start the Worker and local bindings
npm run dev:worker

# Terminal 2: start Astro with API/share proxies
npm run dev
```

### Development Commands

```bash
# Run the Astro development server
npm run dev

# Run the Worker with local D1, R2 and built static assets
npm run dev:worker

# Build for production
npm run build

# Build and run the production-shaped local application
npm run build
npm run dev:worker

# Build the exact Wrangler bundle without deploying
npm run deploy:dry

# Deploy to Cloudflare Workers
npm run deploy
```

The final Astro build is emitted to `dist`. Wrangler serves those assets
directly and invokes the Hono Worker first for `/api/*`, `/share/*`, and
`/report/*`.

### Production prerequisites

The `httpscanner.com` zone must use Cloudflare DNS. Before deploying lead
submissions, onboard `httpscanner.com` for Email Sending and verify
`pietrucha.bartosz+scanner@gmail.com` as a destination address in the
Cloudflare account. Apply the D1 migration separately after reviewing it.

Run these production operations manually; local development and builds do not
run them:

```bash
npx wrangler email sending list
npx wrangler email sending enable httpscanner.com
npx wrangler email sending dns get httpscanner.com
npx wrangler d1 migrations apply http_scanner_db --remote
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Type-check Astro, React and Worker sources
npm run check

# Run ESLint
npm run lint
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please follow the conventional commits standard for your commit messages and use feature branches with descriptive names.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
