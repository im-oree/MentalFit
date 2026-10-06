import { Heart } from 'lucide-react'

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Heart className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">MentalFit</h1>
        <p className="text-lg text-gray-600">Your mental wellness companion</p>
      </div>
    </div>
  )
}
