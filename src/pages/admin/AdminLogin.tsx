import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/error-logger';
import LoginCard from '../../components/ui/login-card';

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
      logError('AdminLogin.signInWithPassword', error, { email: values.email });

      // Tampilkan pesan ramah dalam Bahasa Indonesia
      const friendlyMessages: Record<string, string> = {
        'User is banned': 'Email atau password salah. Silakan coba lagi.',
        'Invalid login credentials': 'Email atau password salah. Silakan coba lagi.',
        'Email not confirmed': 'Email belum diverifikasi. Silakan cek kotak masuk Anda.',
        'Too many requests': 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.',
      };

      setAuthError(friendlyMessages[error.message] || 'Terjadi kesalahan saat login. Silakan coba lagi nanti.');
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .maybeSingle();
    if (adminError || !adminData) {
      if (adminError) {
        logError('AdminLogin.isAdmin', adminError, { email: values.email });
      }
      await supabase.auth.signOut();
      setAuthError('Akun ini tidak memiliki akses admin.');
      return;
    }

    const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';
    navigate(redirectTo, { replace: true });
  }

  return (
    <LoginCard
      onSubmit={handleSubmit(onSubmit)}
      registerEmail={register('email')}
      registerPassword={register('password')}
      isSubmitting={isSubmitting}
      authError={authError}
      validationErrors={{
        email: errors.email?.message,
        password: errors.password?.message,
      }}
    />
  );
}
