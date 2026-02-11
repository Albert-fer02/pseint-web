import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/app/router'
import { ThemeProvider } from '@/app/providers/ThemeProvider'

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
