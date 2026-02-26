'use client'

import { motion } from 'framer-motion'
import { Ticket, Copy, Check } from 'lucide-react'
import { useState } from 'react'

type Coupon = {
  id: string
  title: string
  description: string
  discount_percent: number | null
  discount_amount: number | null
  coupon_code: string | null
  expiry_date: string | null
}

type CouponsDisplayProps = {
  coupons: Coupon[]
}

export default function CouponsDisplay({ coupons }: CouponsDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (!coupons || coupons.length === 0) {
    return null
  }

  const handleCopyCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Ticket className="w-5 h-5 text-purple-500" />
        <h3 className="text-xl font-bold text-white">Special Deals & Coupons</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((coupon, index) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-600/30 rounded-xl p-4 hover:border-purple-500/50 transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">{coupon.title}</h4>
                <p className="text-sm text-gray-300 mt-1">{coupon.description}</p>
              </div>
              {coupon.discount_percent && (
                <div className="ml-4 bg-purple-600/40 rounded-lg px-3 py-2 text-center">
                  <p className="text-2xl font-bold text-purple-300">
                    {coupon.discount_percent}%
                  </p>
                  <p className="text-xs text-purple-400">OFF</p>
                </div>
              )}
              {coupon.discount_amount && (
                <div className="ml-4 bg-purple-600/40 rounded-lg px-3 py-2 text-center">
                  <p className="text-2xl font-bold text-purple-300">
                    ${coupon.discount_amount}
                  </p>
                  <p className="text-xs text-purple-400">OFF</p>
                </div>
              )}
            </div>

            {coupon.coupon_code && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCopyCoupon(coupon.coupon_code!, coupon.id)}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/50 rounded-lg text-purple-300 font-semibold transition"
              >
                {copiedId === coupon.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="font-mono">{coupon.coupon_code}</span>
                  </>
                )}
              </motion.button>
            )}

            {coupon.expiry_date && (
              <p className="text-xs text-gray-400 mt-3">
                ⏰ Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
