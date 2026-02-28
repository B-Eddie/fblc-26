"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function EditOpportunityPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    hours_available: 10,
    is_flexible: false,
    perks: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, [params.id]);

  const checkAuthAndFetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      // Get business profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if ((profileData as any)?.role !== "business") {
        router.push("/business/dashboard");
        return;
      }

      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (!businessData) {
        router.push("/business/setup");
        return;
      }

      setBusiness(businessData);

      // Fetch existing opportunity
      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", params.id)
        .single();

      if (oppError || !oppData) {
        throw oppError || new Error("Opportunity not found");
      }

      // Ensure the opportunity belongs to this business
      if (oppData.business_id !== businessData.id) {
        router.push("/business/dashboard");
        return;
      }

      setFormData({
        title: oppData.title || "",
        description: oppData.description || "",
        requirements: oppData.requirements || "",
        hours_available: oppData.hours_available || 0,
        is_flexible: oppData.is_flexible || false,
        perks: oppData.perks || "",
        start_date: oppData.start_date || "",
        end_date: oppData.end_date || "",
      });
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      router.push("/business/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError("Title is required");
        setSubmitting(false);
        return;
      }
      if (!formData.description.trim()) {
        setError("Description is required");
        setSubmitting(false);
        return;
      }
      if (!formData.requirements.trim()) {
        setError("Requirements are required");
        setSubmitting(false);
        return;
      }
      if (formData.hours_available <= 0) {
        setError("Hours available must be greater than 0");
        setSubmitting(false);
        return;
      }
      if (!formData.start_date) {
        setError("Start date is required");
        setSubmitting(false);
        return;
      }
      if (!formData.end_date) {
        setError("End date is required");
        setSubmitting(false);
        return;
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        setError("End date must be after start date");
        setSubmitting(false);
        return;
      }

      // Update opportunity
      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          requirements: formData.requirements.trim(),
          hours_available: formData.hours_available,
          is_flexible: formData.is_flexible,
          perks: formData.perks.trim() || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (updateError) throw updateError;

      // Redirect to the business dashboard
      router.push("/business/dashboard");
    } catch (error: any) {
      console.error("Error updating opportunity:", error);
      setError(error.message || "Failed to update opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-gray-700/30 border-t-gray-700 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
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

      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-40 bg-black/80 backdrop-blur-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/business/dashboard"
              className="hover:opacity-80 transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition"
            >
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <img src="/image.png" alt="Logo" className="w-12 h-12 object-contain" />
              </motion.div>
              <span className="text-2xl font-bold font-display bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                Vertex
              </span>
            </Link>
          </motion.div>
        </nav>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold font-display bg-gradient-to-r from-white via-gray-300 to-gray-400 bg-clip-text text-transparent mb-3">
            Edit Opportunity
          </h1>
          <p className="text-gray-400 text-lg">
            Update the details for this opportunity
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-600/20 border border-red-600/30 rounded-xl p-4 flex items-start space-x-4"
          >
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="space-y-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Opportunity Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Community Garden Assistant"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
              />
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what volunteers will do in detail..."
                rows={5}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition resize-none"
              />
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Requirements *
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="What skills, experience, or background do volunteers need?"
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition resize-none"
              />
            </motion.div>

            {/* Hours and Flexibility */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Hours Available *
                </label>
                <input
                  type="number"
                  name="hours_available"
                  value={formData.hours_available}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_flexible"
                    checked={formData.is_flexible}
                    onChange={handleInputChange}
                    className="w-4 h-4 bg-gray-800/50 border border-gray-700/50 rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-300">
                    Flexible Schedule
                  </span>
                </label>
              </div>
            </motion.div>

            {/* Perks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Perks or Benefits
              </label>
              <textarea
                name="perks"
                value={formData.perks}
                onChange={handleInputChange}
                placeholder="e.g., Free training, meal provided, certificate upon completion..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition resize-none"
              />
            </motion.div>

            {/* Dates */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="date-picker-icon-white w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="date-picker-icon-white w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition"
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex space-x-4 pt-6 border-t border-gray-700/50"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => router.push("/business/dashboard")}
                className="flex-1 px-6 py-3 bg-gray-800/50 text-gray-300 rounded-lg font-semibold hover:bg-gray-700/50 transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-gray-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </motion.button>
            </motion.div>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
