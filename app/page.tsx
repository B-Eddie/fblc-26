'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Users, Star, Zap, ArrowRight } from 'lucide-react'
import AnimatedContainer from '@/components/AnimatedContainer'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white overflow-hidden">
      {/* Animated Background Elements */}
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

      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-50 bg-black/80 backdrop-blur-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-white font-bold text-xl">V</span>
              </motion.div>
              <span className="text-2xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                Vertex
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition duration-300 font-medium"
              >
                Log In
              </Link>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/auth/signup"
                  className="px-6 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition duration-300"
                >
                  Sign Up
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          className="text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-block px-4 py-2 bg-gray-600/10 border border-gray-600/30 rounded-full text-gray-300 text-sm font-medium mb-6">
              ✨ Connect. Volunteer. Grow.
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight font-display bg-gradient-to-b from-white via-gray-300 to-gray-400 bg-clip-text text-transparent"
          >
            Find Your Next Opportunity
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Connect with local businesses and gain real-world experience. Students need 40 hours—businesses need talented volunteers.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex justify-center space-x-4 flex-wrap gap-4 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/browse"
                className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg text-lg font-semibold hover:shadow-xl hover:shadow-white/20 transition duration-300 group"
              >
                Browse Opportunities
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/auth/signup?role=business"
                className="inline-flex items-center px-8 py-4 bg-gray-800/50 text-white border border-gray-600/30 rounded-lg text-lg font-semibold hover:border-gray-500/60 hover:bg-gray-800 transition duration-300 group"
              >
                Post an Opportunity
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            { icon: Users, label: '40 hrs', desc: 'Required for Ontario graduation' },
            { icon: MapPin, label: 'Local', desc: 'Opportunities in your area' },
            { icon: Star, label: 'Real', desc: 'Meaningful work experience' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
              <div className="relative bg-gray-900/40 border border-gray-800/60 p-8 rounded-2xl hover:border-gray-600/40 transition duration-300 backdrop-blur-sm">
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700/20 to-gray-600/20 rounded-xl mb-4 border border-gray-600/20"
                >
                  <stat.icon className="w-8 h-8 text-gray-400" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-2 text-white">{stat.label}</h3>
                <p className="text-gray-400">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          className="mt-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16 font-display bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { num: 1, title: 'Search & Filter', desc: 'Find opportunities by category, location, or keywords.' },
              { num: 2, title: 'Apply Today', desc: 'Apply to opportunities with a single click.' },
              { num: 3, title: 'Track & Succeed', desc: 'Monitor hours and reach your 40-hour goal.' },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-300" />
                <div className="relative bg-gray-900/40 border border-gray-800/60 p-8 rounded-2xl hover:border-gray-600/40 transition duration-300 backdrop-blur-sm">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold mb-4"
                  >
                    {step.num}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="mt-32 mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700/30 via-gray-600/30 to-gray-700/30 blur-2xl" />
            <div className="relative bg-gradient-to-r from-gray-900/80 to-gray-900/50 border border-gray-600/20 rounded-2xl p-12 text-center backdrop-blur-sm">
              <motion.h2
                className="text-4xl md:text-5xl font-bold mb-4 font-display"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Ready to Get Started?
              </motion.h2>
              <motion.p
                className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
              >
                Join thousands of students and businesses on Vertex today.
              </motion.p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg text-lg font-semibold hover:shadow-xl hover:shadow-gray-600/50 transition duration-300 group"
                >
                  Create Your Account
                  <Zap className="ml-2 w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/50 mt-24 py-12 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-lg font-bold">Vertex</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting students with meaningful volunteer opportunities.
              </p>
            </motion.div>
            <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h4 className="font-semibold mb-4">For Students</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link href="/browse" className="hover:text-gray-300 transition">
                    Browse Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-gray-300 transition">
                    Track Hours
                  </Link>
                </li>
              </ul>
            </motion.div>
            <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h4 className="font-semibold mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link href="/auth/signup?role=business" className="hover:text-gray-300 transition">
                    Post Opportunities
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-gray-300 transition">
                    Manage Listings
                  </Link>
                </li>
              </ul>
            </motion.div>
          </motion.div>
          <motion.div
            className="border-t border-gray-800 pt-8 text-center text-gray-600 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p>&copy; 2026 Vertex. All rights reserved.</p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
