"use client"

import * as React from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { motion } from "framer-motion"
import { ArrowLeft, LockKeyhole, Mail, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import Logo from "../shared/Logo"
import { ParticleCanvas } from "./particle-canvas-1"

interface LoginCardProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  registerEmail: any;
  registerPassword: any;
  isSubmitting: boolean;
  authError: string | null;
  validationErrors: {
    email?: string;
    password?: string;
  };
}

export default function LoginCard({
  onSubmit,
  registerEmail,
  registerPassword,
  isSubmitting,
  authError,
  validationErrors
}: LoginCardProps) {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#fafaf9]">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <ParticleCanvas maxParticles={800} speedScale={1} />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/50 via-transparent to-emerald-50/30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-emerald-700 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Kembali ke website
          </Link>
          <div className="flex justify-center mb-4">
            <Logo size={48} showText={false} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Admin Portal</h2>
          <p className="text-sm text-muted-foreground mt-2">Masuk untuk mengelola platform Sekolah Tanah Air</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-6">
          {authError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
              <div>
                <p className="font-bold">Login gagal</p>
                <p className="text-xs mt-0.5 opacity-90">{authError}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sta.id"
                  className="pl-10"
                  {...registerEmail}
                />
              </div>
              {validationErrors.email && (
                <p className="text-[11px] font-medium text-rose-600 ml-1">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="pl-10"
                  {...registerPassword}
                />
              </div>
              {validationErrors.password && (
                <p className="text-[11px] font-medium text-rose-600 ml-1">{validationErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memverifikasi..." : "Masuk Sekarang"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Hanya untuk administrator resmi.<br/>
              Lupa password? Hubungi tim IT.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
