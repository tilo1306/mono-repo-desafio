import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="p-2">
      <h3 className="text-2xl font-bold">About</h3>
      <p className="mt-4">
        This is the about page. Built with modern React stack:
      </p>
      <ul className="mt-4 list-disc list-inside">
        <li>React 18</li>
        <li>TypeScript</li>
        <li>Vite</li>
        <li>TanStack Router</li>
        <li>TanStack React Query</li>
        <li>Tailwind CSS</li>
      </ul>
    </div>
  )
}
