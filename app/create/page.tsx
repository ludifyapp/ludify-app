import Link from 'next/link'
import { CreateEventForm } from '@/components/forms/CreateEventForm'

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Create a Game Night</h1>
          <CreateEventForm />
        </div>
      </div>
    </main>
  )
}
