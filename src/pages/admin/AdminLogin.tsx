import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Logo from '../../components/shared/Logo';
import { supabase } from '../../lib/supabase';

const adminLoginSchema = z.object({
  email: z.email('Email tidak valid.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
});

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: AdminLoginValues) {
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f7f7f3] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_42%),linear-gradient(135deg,#0f3d2e_0%,#106b4a_48%,#d9f99d_100%)] p-8 text-white sm:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.10)_0%,transparent_35%,rgba(255,255,255,0.08)_100%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <Link to="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur">
                <ArrowLeft size={16} />
                Kembali ke website
              </Link>
              <div className="max-w-xl space-y-5">
                <Logo size={48} showText variant="light" />
                <div className="space-y-4">
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-100">Admin Portal</p>
                  <h1 className="font-serif text-4xl font-black leading-tight sm:text-5xl">
                    Kelola program, campaign, donasi, dan CMS STA dari satu panel.
                  </h1>
                  <p className="max-w-lg text-sm leading-7 text-white/80 sm:text-base">
                    Pola panel ini mengikuti ritme admin dashboard yang lebih editorial: navigasi tetap, fokus ke data penting, dan form yang langsung terhubung ke Supabase.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Program', 'Kelola detail program utama STA secara terpusat.'],
                ['Campaign', 'Atur target, gambar, dan status penggalangan dana.'],
                ['CMS', 'Kontrol copy hero dan blok konten dari panel admin.'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-100">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/80">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">Masuk Admin</p>
              <div>
                <h2 className="text-3xl font-black text-gray-900">Login ke panel STA</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
                  Gunakan akun Supabase Auth yang sudah diberi akses untuk mengelola dashboard admin.
                </p>
              </div>
            </div>

            {authError ? (
              <div className="flex items-start gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Login gagal.</p>
                  <p className="mt-1">{authError}</p>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Email</span>
                <div className="flex items-center rounded-[1.25rem] border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15">
                  <Mail size={18} className="mr-3 text-gray-400" />
                  <input
                    type="email"
                    placeholder="admin@sta.id"
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    {...register('email')}
                  />
                </div>
                {errors.email ? <p className="text-sm font-medium text-rose-600">{errors.email.message}</p> : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Password</span>
                <div className="flex items-center rounded-[1.25rem] border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15">
                  <LockKeyhole size={18} className="mr-3 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Masukkan password"
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    {...register('password')}
                  />
                </div>
                {errors.password ? <p className="text-sm font-medium text-rose-600">{errors.password.message}</p> : null}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-[1.25rem] bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Memverifikasi...' : 'Masuk ke Admin'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
