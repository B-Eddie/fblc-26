'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function BusinessSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'retail' as const,
    address: '',
    city: '',
    province: '',
    postal_code: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    email: '',
    website: '',
  })

  const categories = ['retail', 'food', 'services', 'healthcare', 'education', 'other'] as const

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create business record
      const { error: businessError } = await supabase
        .from('businesses')
        .insert([{
          profile_id: user.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          latitude: formData.latitude || 43.6629,
          longitude: formData.longitude || -79.3957, // Default to Toronto if not provided
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
        }] as any)

      if (businessError) throw businessError

      router.push('/business/dashboard')
    } catch (error: any) {
      setError(error.message || 'Failed to create business profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black py-12 px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700/20 rounded-full blur-3xl"
          animate={{ y: [0, 40, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600/20 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white font-display mb-2">Set Up Your Business</h1>
          <p className="text-gray-400">Create your business profile to start posting opportunities</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm space-y-6"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-950/40 border border-red-800/60 text-red-400 px-4 py-3 rounded-lg text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="Your Business Name"
              />
            </motion.div>

            {/* Category */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </motion.div>
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm resize-none"
              placeholder="Tell students about your business and the opportunities you offer"
            />
          </motion.div>

          {/* Address */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
              Street Address *
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
              placeholder="123 Main Street"
            />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* City */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                City *
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="Toronto"
              />
            </motion.div>

            {/* Province */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <label htmlFor="province" className="block text-sm font-medium text-gray-300 mb-2">
                Province *
              </label>
              <input
                id="province"
                name="province"
                type="text"
                value={formData.province}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="ON"
              />
            </motion.div>

            {/* Postal Code */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="col-span-2"
            >
              <label htmlFor="postal_code" className="block text-sm font-medium text-gray-300 mb-2">
                Postal Code *
              </label>
              <input
                id="postal_code"
                name="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="M5V 3A8"
              />
            </motion.div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Phone */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="(416) 555-0123"
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email (Optional)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="info@business.com"
              />
            </motion.div>

            {/* Website */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                Website (Optional)
              </label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/60 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-600 focus:border-transparent transition backdrop-blur-sm"
                placeholder="https://business.com"
              />
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition mt-8"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full mr-2"
                />
                Creating Profile...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                Create Business Profile
                <ArrowRight className="ml-2 w-4 h-4" />
              </span>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  )
}
