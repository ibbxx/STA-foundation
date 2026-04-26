const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://jfzvlzxslmgnssxekcme.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenZsenhzbG1nbnNzeGVrY21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk3NzAyOCwiZXhwIjoyMDkyNTUzMDI4fQ.IAo8Kd2Fy8rC_uuWa0cqi7k-roAn5U0Uf02OhBXK3DE'
);

async function run() {
  const { data: campaigns, error: cErr } = await supabase.from('campaigns').select('id, title').eq('title', 'SUMBANGAN PITTI').limit(1);
  if (cErr) { console.error('Campaign error:', cErr); return; }
  if (!campaigns || campaigns.length === 0) { console.log('Campaign not found'); return; }
  const campaignId = campaigns[0].id;
  console.log('Injecting updates for campaign:', campaigns[0].title);

  const bucket = 'campaign-assets';
  const imgDir = '/Users/ibnufajar/.gemini/antigravity/brain/921582af-7380-4352-a8b3-bfebb6b4e346';
  
  const filesToUpload = [
    'school_construction_1777146387719.png',
    'school_construction_2_1777147738168.png',
    'book_distribution_1777146402888.png',
    'book_distribution_2_1777147754389.png',
    'teacher_training_1777146418184.png',
    'fundraising_milestone_1777146436734.png'
  ];

  const uploadedUrls = {};
  for (const filename of filesToUpload) {
    try {
      const filePath = path.join(imgDir, filename);
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = 'campaign-updates/' + Date.now() + '-' + filename;
      const { data, error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: false,
      });
      if (error) {
        console.error('Upload error for', filename, ':', error.message);
      } else {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        uploadedUrls[filename] = urlData.publicUrl;
        console.log('Uploaded:', filename);
      }
    } catch (e) {
      console.error('Failed processing', filename, e.message);
    }
  }

  const updates = [
    {
      campaign_id: campaignId,
      title: 'Pembangunan Gedung Sekolah Dimulai',
      content: '<h2>Tahap Pertama Konstruksi</h2><p>Tim konstruksi dan relawan lokal mulai membangun fondasi dan dinding sekolah di <strong>Desa Mekarjaya</strong>. Warga setempat turut membantu dengan antusias.</p><ul><li>Pembuatan fondasi selesai 100%</li><li>Pemasangan bata dan kayu struktur bangunan</li></ul><blockquote><p>"Kami sangat bersyukur atas bantuan ini, anak-anak sebentar lagi bisa belajar di tempat yang layak," ujar Bapak Kepala Desa.</p></blockquote>',
      update_type: 'General',
      image_url: uploadedUrls['school_construction_1777146387719.png'],
      images: [
        uploadedUrls['school_construction_1777146387719.png'],
        uploadedUrls['school_construction_2_1777147738168.png']
      ].filter(Boolean),
      created_at: '2026-03-15T08:00:00+08:00',
    },
    {
      campaign_id: campaignId,
      title: 'Distribusi Buku dan Alat Tulis',
      content: '<h3>Penyaluran Paket Pendidikan</h3><p>Sebanyak <strong>200 paket</strong> buku bacaan dan alat tulis telah didistribusikan kepada anak-anak di 3 sekolah pelosok.</p><p>Senyum mereka menjadi semangat kami untuk terus bergerak. Terima kasih kepada semua donatur yang budiman!</p>',
      update_type: 'Distribution',
      image_url: uploadedUrls['book_distribution_1777146402888.png'],
      images: [
        uploadedUrls['book_distribution_1777146402888.png'],
        uploadedUrls['book_distribution_2_1777147754389.png']
      ].filter(Boolean),
      created_at: '2026-03-28T10:00:00+08:00',
    },
    {
      campaign_id: campaignId,
      title: 'Pelatihan Guru Strategi Pembelajaran Aktif',
      content: '<p>Workshop pelatihan guru diadakan selama 3 hari di kecamatan. <em>15 guru</em> dari berbagai desa ikut serta mempelajari metode pengajaran aktif dan penggunaan media ajar lokal.</p>',
      update_type: 'General',
      image_url: uploadedUrls['teacher_training_1777146418184.png'],
      images: [
        uploadedUrls['teacher_training_1777146418184.png']
      ].filter(Boolean),
      created_at: '2026-04-10T09:00:00+08:00',
    },
    {
      campaign_id: campaignId,
      title: 'Target Dana 50% Tercapai',
      content: '<h2>Milestone Penggalangan Dana</h2><p>Alhamdulillah, target penggalangan dana telah mencapai <strong>50%</strong>. Terima kasih kepada seluruh donatur yang telah berkontribusi.</p><p>Pembangunan terus berjalan sesuai jadwal dan kami berharap dapat meresmikan gedung baru bulan depan.</p>',
      update_type: 'Fundraising Progress',
      image_url: uploadedUrls['fundraising_milestone_1777146436734.png'],
      images: [
        uploadedUrls['fundraising_milestone_1777146436734.png']
      ].filter(Boolean),
      created_at: '2026-04-20T14:00:00+08:00',
    },
  ];

  const { data: insertData, error: insertErr } = await supabase.from('campaign_updates').insert(updates).select();
  if (insertErr) {
    console.error('Insert error:', insertErr.message);
  } else {
    console.log('SUCCESS! Inserted', insertData.length, 'timeline updates with rich text and images.');
  }
}

run().catch(console.error);
