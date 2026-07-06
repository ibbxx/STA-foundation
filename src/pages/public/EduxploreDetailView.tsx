import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Globe, ArrowLeft } from 'lucide-react';

import EduxploreHero from '../../components/public/eduxplore/EduxploreHero';
import EduxploreTimeline from '../../components/public/eduxplore/EduxploreTimeline';
import EduxploreDetail from '../../components/public/eduxplore/EduxploreDetail';
import EduxploreForm from '../../components/public/eduxplore/EduxploreForm';

import { fetchVolunteerProgramBySlug } from '../../lib/admin/repository';
import type { VolunteerProgramData, VolunteerTimelineItem } from '../../lib/eduxplore';
import { getVolunteerProgramStatus } from '../../lib/eduxplore';
import type { VolunteerProgramRow } from '../../lib/supabase/types';
import { logError } from '../../lib/error-logger';
import { createBreadcrumbJsonLd, createEventJsonLd, truncateText, useSeo } from '../../lib/seo';

export default function EduxploreDetailView() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<VolunteerProgramData | null>(null);
  const seoDescription = program
    ? truncateText(program.short_description || program.description || `Pendaftaran dan detail program relawan ${program.title} bersama Sekolah Tanah Air.`)
    : 'Detail program relawan EduXplore Sekolah Tanah Air.';
  const eventSchema = program
    ? createEventJsonLd({
      name: program.title,
      description: seoDescription,
      path: `/eduxplore/${program.slug}`,
      image: program.image_url,
      location: program.location,
      startDate: program.registration_start,
      endDate: program.program_end ?? program.registration_end,
    })
    : null;

  useSeo({
    title: program ? program.title : 'Detail Program Relawan',
    description: seoDescription,
    path: `/eduxplore/${slug ?? ''}`,
    image: program?.image_url,
    type: 'article',
    robots: !loading && !program ? 'noindex,follow' : 'index,follow',
    structuredData: program
      ? [
        createBreadcrumbJsonLd([
          { name: 'Beranda', path: '/' },
          { name: 'Event', path: '/events' },
          { name: program.title, path: `/eduxplore/${program.slug}` },
        ]),
        ...(eventSchema ? [eventSchema] : []),
      ]
      : undefined,
  });

  useEffect(() => {
    if (!loading && program && location.hash === '#form-pendaftaran') {
      const timer = setTimeout(() => {
        const element = document.getElementById('form-pendaftaran');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, program, location.hash]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data: rawData, error } = await fetchVolunteerProgramBySlug(slug!);
        const data = rawData as VolunteerProgramRow | null;
        if (error || !data) {
          setProgram(null);
        } else {
          // Parse JSONB fields safely
          let timeline: VolunteerTimelineItem[] = [];
          let requirements: string[] = [];
          let formConfig: any = null;

          try {
            timeline = Array.isArray(data.timeline) ? data.timeline as unknown as VolunteerTimelineItem[] : JSON.parse(data.timeline as string);
          } catch { timeline = []; }

          try {
            requirements = Array.isArray(data.requirements) ? data.requirements as unknown as string[] : JSON.parse(data.requirements as string);
          } catch { requirements = []; }

          try {
            if (data.form_config) {
              formConfig = typeof data.form_config === 'string'
                ? JSON.parse(data.form_config)
                : data.form_config;
            } else {
              formConfig = null;
            }
          } catch { formConfig = null; }

          setProgram({
            id: data.id,
            slug: data.slug,
            title: data.title,
            location: data.location,
            image_url: data.image_url,
            timeline,
            requirements,
            description: data.description,
            short_description: data.short_description,
            show_in_hero: data.show_in_hero,
            program_type: data.program_type || 'eduxplore',
            status: data.status,
            form_config: formConfig,
            external_link: data.external_link,
            registration_start: data.registration_start,
            registration_end: data.registration_end,
            program_end: data.program_end,
          });
        }
      } catch (err) {
        logError('EduxploreDetailView.load', err);
        setProgram(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Not found
  if (!program) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-24 px-5">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600">
              <Globe size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Program Tidak Ditemukan
            </h1>
            <p className="text-gray-500 leading-relaxed">
              Program volunteer yang Anda cari tidak tersedia atau belum dibuka.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all hover:-translate-y-1"
            >
              <ArrowLeft size={18} className="mr-2" />
              Kembali ke Beranda
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] selection:bg-emerald-600 selection:text-white">
      <EduxploreHero program={program} />
      <EduxploreTimeline timeline={program.timeline} />
      <EduxploreDetail
        description={program.description}
        requirements={program.requirements}
        programTitle={program.title}
      />
      <EduxploreForm
        programId={program.id}
        programTitle={program.title}
        isOpen={getVolunteerProgramStatus(program) === 'open'}
        formConfig={program.form_config}
        externalLink={program.external_link}
      />
    </div>
  );
}
