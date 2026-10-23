import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Respecte le réglage système « réduire les animations » pour toutes les animations Motion. */}
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <App />
      </CartProvider>
    </MotionConfig>
  </StrictMode>,
)
