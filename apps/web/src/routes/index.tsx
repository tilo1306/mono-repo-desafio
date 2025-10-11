import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <h3 className="text-2xl font-bold">Welcome Home!</h3>
      <p className="mt-4">
        This is a React app with Vite, TypeScript, TanStack Router, React Query, and Tailwind CSS.
      </p>
    </div>
  )
}
