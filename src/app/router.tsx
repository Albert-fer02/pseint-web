import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/app/layout/RootLayout'
import { PlaygroundPage } from '@/pages/playground/ui/PlaygroundPage'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PlaygroundPage,
})

const routeTree = rootRoute.addChildren([indexRoute])

const routerBasePath = import.meta.env.BASE_URL === '/'
  ? '/'
  : import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createRouter({
  routeTree,
  basepath: routerBasePath,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
