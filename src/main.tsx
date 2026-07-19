import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PostHogProvider } from '@posthog/react'
import { initializePostHog } from './lib/posthogClient'

const posthog = initializePostHog()

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  posthog ? (
    <PostHogProvider client={posthog}>
      {app}
    </PostHogProvider>
  ) : app,
)
