# HTTP Scanner

A modern web application for scanning and analyzing HTTP security headers of websites, following OWASP Secure Headers Project recommendations.

## 🚀 Features

- **Quick Security Analysis**: Scan any public website for security headers in seconds
- **Comprehensive Scoring**: Get a 0-100 security score based on weighted rules
- **Detailed Reports**: View detected headers, missing headers, and leaking headers
- **Shareable Results**: Each scan generates a unique URL with shareable image for social media

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript 5
- Vite for fast bundling
- Tailwind CSS 4 + shadcn/ui components
- Hash-based routing

### Backend
- Cloudflare Workers (TypeScript)
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

# Start development server
npm run dev
```

### Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests with Playwright
npm run test:e2e
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
