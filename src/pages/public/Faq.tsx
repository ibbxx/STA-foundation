import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const FAQ_ITEMS = [
  {
    question: 'Bagaimana cara memulai penggalangan dana?',
    answer:
      'Anda cukup mendaftar akun, membuat halaman campaign dengan informasi lengkap, lalu membagikannya ke jaringan Anda. Tim kami akan memverifikasi campaign dalam 1x24 jam.',
  },
  {
    question: 'Apakah ada biaya yang dikenakan saat berdonasi?',
    answer:
      'Kami mengenakan biaya platform sebesar 5% dari total donasi yang terkumpul untuk operasional dan pengembangan platform. Tidak ada biaya tersembunyi.',
  },
  {
    question: 'Bagaimana saya bisa yakin dana tersalur dengan benar?',
    answer:
      'Setiap campaign wajib memberikan update berkala dan laporan penggunaan dana. Kami juga melakukan verifikasi identitas penggalang dana dan menyediakan laporan transparansi publik.',
  },
  {
    question: 'Berapa lama proses pencairan dana ke penggalang?',
    answer:
      'Dana dapat dicairkan kapan saja setelah minimal terkumpul Rp 1.000.000. Proses transfer membutuhkan 1-3 hari kerja ke rekening yang terdaftar.',
  },
  {
    question: 'Apakah saya bisa membuat campaign anonim?',
    answer:
      'Ya, Anda bisa memilih untuk menyembunyikan identitas sebagai penggalang dana. Namun, kami tetap memerlukan verifikasi identitas untuk keamanan.',
  },
];

export default function Faq() {
  const [openItem, setOpenItem] = useState<number>(0);

  return (
    <div className="bg-white">
      <section className="bg-emerald-50/50 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Bantuan</p>
          <h1 className="mt-4 text-3xl font-black text-gray-900 sm:text-4xl md:text-5xl">Pertanyaan yang Sering Ditanyakan</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Jawaban singkat untuk pertanyaan umum seputar campaign, donasi, dan transparansi Sekolah Tanah Air.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openItem === index;

              return (
                <div key={item.question} className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenItem(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  >
                    <span className="text-base font-bold leading-snug text-gray-900 sm:text-lg">{item.question}</span>
                    <ChevronDown
                      size={18}
                      className={cn('shrink-0 text-gray-400 transition-transform duration-200', isOpen && 'rotate-180 text-emerald-600')}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-gray-100 px-5 py-5 sm:px-6">
                      <p className="text-sm leading-relaxed text-gray-600 sm:text-base">{item.answer}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
