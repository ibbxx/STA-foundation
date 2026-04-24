import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  FileClock,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Image as ImageIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import CampaignStatusBadge, { getCampaignTemporalStatus } from '../../components/admin/campaigns/CampaignStatusBadge';
import ImageDropzone, { ImagePreviewItem } from '../../components/admin/campaigns/ImageDropzone';
import RichTextEditor from '../../components/admin/campaigns/RichTextEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import AdminModal from '../../components/admin/AdminModal';
import {
  CampaignManagerValues,
  CampaignUpdateValues,
  campaignManagerSchema,
  campaignUpdateSchema,
} from '../../lib/admin-schemas';
import { formatAdminDate } from '../../lib/admin-helpers';
import { deleteFilesFromStorage, getCampaignAssetsBucketName, uploadFileToStorage } from '../../lib/supabase-storage';
import {
  CampaignInsert,
  CampaignRow,
  CampaignUpdateInsert,
  CampaignUpdateRow,
  CategoryRow,
  DonationRow,
  supabase,
} from '../../lib/supabase';
import { cn } from '../../lib/utils';

const defaultCampaignValues: CampaignManagerValues = {
  title: '',
  category_id: '',
  target_amount: 0,
  start_date: '',
  end_date: '',
  description: '',
  is_featured: false,
};

const defaultUpdateValues: CampaignUpdateValues = {
  title: '',
  content: '',
  update_type: 'General',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getCampaignImages(campaign: CampaignRow | null) {
  if (!campaign) return [];
  if (Array.isArray(campaign.images) && campaign.images.length > 0) return campaign.images;
  if (campaign.image_url) return [campaign.image_url];
  return [];
}

function toExistingImageItems(urls: string[]): ImagePreviewItem[] {
  return urls.map((url, index) => ({
    id: `existing-${index}-${url}`,
    url,
    name: `image-${index + 1}`,
    kind: 'existing',
  }));
}

function toQueuedImageItems(files: File[]): ImagePreviewItem[] {
  return files.map((file) => ({
    id: `queued-${crypto.randomUUID()}`,
    url: URL.createObjectURL(file),
    name: file.name,
    kind: 'queued',
    file,
  }));
}

function revokeQueuedItems(items: ImagePreviewItem[]) {
  items.forEach((item) => {
    if (item.kind === 'queued') {
      URL.revokeObjectURL(item.url);
    }
  });
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 'Tanggal belum lengkap';
  return `${startDate} - ${endDate}`;
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdateRow[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignImages, setCampaignImages] = useState<ImagePreviewItem[]>([]);
  const [timelineImage, setTimelineImage] = useState<ImagePreviewItem | null>(null);
  const [timelineImageFile, setTimelineImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const campaignForm = useForm<CampaignManagerValues>({
    resolver: zodResolver(campaignManagerSchema),
    defaultValues: defaultCampaignValues,
  });

  const updateForm = useForm<CampaignUpdateValues>({
    resolver: zodResolver(campaignUpdateSchema),
    defaultValues: defaultUpdateValues,
  });

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filteredCampaigns = useMemo(() => {
    const query = campaignSearch.trim().toLowerCase();
    if (!query) return campaigns;

    return campaigns.filter((campaign) => {
      const categoryName = campaign.category_id ? categoryMap.get(campaign.category_id)?.name ?? '' : '';
      return [campaign.title, campaign.slug, categoryName]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [campaignSearch, campaigns, categoryMap]);

  async function loadCampaignManager(preferredCampaignId?: string | null) {
    setLoading(true);
    setError(null);

    const [{ data: campaignRows, error: campaignsError }, { data: categoryRows, error: categoriesError }] = await Promise.all([
      supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
    ]);

    if (campaignsError || categoriesError) {
      setError(campaignsError?.message ?? categoriesError?.message ?? 'Gagal memuat campaign manager.');
      setCampaigns([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const nextCampaigns: CampaignRow[] = campaignRows ?? [];
    const nextCategories: CategoryRow[] = categoryRows ?? [];

    setCampaigns(nextCampaigns);
    setCategories(nextCategories);
    setLoading(false);

    setSelectedCampaignId((current) => {
      const targetId = preferredCampaignId ?? current;
      if (targetId && nextCampaigns.some((campaign) => campaign.id === targetId)) {
        return targetId;
      }

      return nextCampaigns[0]?.id ?? null;
    });
  }

  async function loadCampaignUpdates(campaignId: string) {
    setLoadingUpdates(true);

    const { data, error: updatesError } = await supabase
      .from('campaign_updates')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (updatesError) {
      setError(updatesError.message);
      setUpdates([]);
      setLoadingUpdates(false);
      return;
    }

    setUpdates(data ?? []);
    setLoadingUpdates(false);
  }

  function resetCampaignEditor(campaign: CampaignRow | null) {
    campaignForm.reset({
      title: campaign?.title ?? '',
      category_id: campaign?.category_id ?? '',
      target_amount: campaign?.target_amount ?? 0,
      start_date: campaign?.start_date ?? '',
      end_date: campaign?.end_date ?? '',
      description: campaign?.description ?? '',
      is_featured: campaign?.is_featured ?? false,
    });

    setCampaignImages((current) => {
      revokeQueuedItems(current);
      return toExistingImageItems(getCampaignImages(campaign));
    });
  }

  function resetTimelineComposer() {
    updateForm.reset(defaultUpdateValues);
    setTimelineImage((current) => {
      if (current?.kind === 'queued') {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
    setTimelineImageFile(null);
  }

  function handleNewCampaign() {
    setNotice(null);
    setError(null);
    setSelectedCampaignId(null);
    setUpdates([]);
    resetCampaignEditor(null);
    resetTimelineComposer();
    setIsModalOpen(true);
  }

  function handleCampaignImageAdd(files: File[]) {
    const nextQueuedItems = toQueuedImageItems(files);
    setCampaignImages((current) => [...current, ...nextQueuedItems]);
  }

  function handleCampaignImageRemove(id: string) {
    setCampaignImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.kind === 'queued') {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  function handleTimelineImageAdd(files: File[]) {
    const [file] = files;
    if (!file) return;

    setTimelineImage((current) => {
      if (current?.kind === 'queued') {
        URL.revokeObjectURL(current.url);
      }

      return {
        id: `timeline-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        name: file.name,
        kind: 'queued',
      };
    });
    setTimelineImageFile(file);
  }

  function handleTimelineImageRemove() {
    setTimelineImage((current) => {
      if (current?.kind === 'queued') {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
    setTimelineImageFile(null);
  }

  useEffect(() => {
    loadCampaignManager();
    return () => {
      revokeQueuedItems(campaignImages);
      if (timelineImage?.kind === 'queued') {
        URL.revokeObjectURL(timelineImage.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    resetCampaignEditor(selectedCampaign);
    resetTimelineComposer();

    if (!selectedCampaignId) {
      setUpdates([]);
      return;
    }

    loadCampaignUpdates(selectedCampaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, selectedCampaign]);

  async function handleCampaignSubmit(values: CampaignManagerValues) {
    setError(null);
    setNotice(null);

    try {
      const existingUrls = campaignImages
        .filter((item) => item.kind === 'existing')
        .map((item) => item.url);

      const queuedItems = campaignImages.filter((item) => item.kind === 'queued');

      let freshUploads: string[] = [];
      if (queuedItems.length > 0) {
        try {
          freshUploads = await Promise.all(
            queuedItems
              .filter((item): item is ImagePreviewItem & { file: File } => Boolean(item.file))
              .map((item) => uploadFileToStorage(item.file, {
                bucket: getCampaignAssetsBucketName(),
                folder: 'campaigns',
              })),
          );
        } catch (uploadError) {
          setError(`Gagal mengupload gambar: ${uploadError instanceof Error ? uploadError.message : 'Periksa koneksi dan pastikan storage bucket sudah dibuat.'}`);
          return;
        }
      }

      const imageUrls = [...existingUrls, ...freshUploads];
      const categoryName = categoryMap.get(values.category_id)?.name ?? null;
      const temporalStatus = getCampaignTemporalStatus(values.start_date, values.end_date);

      const slug = selectedCampaign?.slug || `${slugify(values.title)}-${Date.now().toString(36)}`;

      const payload: CampaignInsert = {
        slug,
        title: values.title.trim(),
        category_id: values.category_id,
        description: values.description.trim(),
        images: imageUrls,
        start_date: values.start_date,
        end_date: values.end_date,
        is_featured: values.is_featured,
        target_amount: values.target_amount,
        image_url: imageUrls[0] ?? null,
        category: categoryName,
        status: temporalStatus === 'Ended' ? 'completed' : 'active',
        current_amount: selectedCampaign?.current_amount ?? 0,
      };

      const query = selectedCampaign
        ? supabase.from('campaigns').update(payload as never).eq('id', selectedCampaign.id).select('*').single()
        : supabase.from('campaigns').insert(payload as never).select('*').single();

      const { data, error: submitError } = await query;

      if (submitError) {
        const msg = submitError.message;
        if (msg.includes('duplicate') || msg.includes('unique')) {
          setError('Slug campaign sudah digunakan. Coba ubah judul sedikit lalu simpan ulang.');
        } else if (msg.includes('not-null') || msg.includes('null value')) {
          setError('Ada kolom wajib yang belum terisi. Pastikan semua field sudah dilengkapi.');
        } else if (msg.includes('foreign key') || msg.includes('fkey')) {
          setError('Kategori yang dipilih tidak valid. Refresh halaman dan coba lagi.');
        } else if (msg.includes('permission') || msg.includes('policy')) {
          setError('Akses ditolak. Pastikan Anda sudah login sebagai admin dan RLS policy sudah dikonfigurasi.');
        } else {
          setError(msg);
        }
        return;
      }

      const savedCampaign = data as CampaignRow | null;
      const nextId = savedCampaign?.id ?? selectedCampaign?.id ?? null;
      setNotice(selectedCampaign ? 'Campaign berhasil diperbarui.' : 'Campaign berhasil dibuat.');
      await loadCampaignManager(nextId);
      setIsModalOpen(false);
    } catch (unexpectedError) {
      setError(`Terjadi kesalahan: ${unexpectedError instanceof Error ? unexpectedError.message : 'Silakan coba lagi.'}`);
    }
  }

  async function handleUpdateSubmit(values: CampaignUpdateValues) {
    if (!selectedCampaignId) return;

    setError(null);
    setNotice(null);

    let imageUrl: string | null = null;
    if (timelineImageFile) {
      imageUrl = await uploadFileToStorage(timelineImageFile, {
        bucket: getCampaignAssetsBucketName(),
        folder: 'campaign-updates',
      });
    }

    const payload: CampaignUpdateInsert = {
      campaign_id: selectedCampaignId,
      title: values.title.trim(),
      content: values.content.trim(),
      update_type: values.update_type,
      image_url: imageUrl,
    };

    const { error: submitError } = await supabase.from('campaign_updates').insert(payload as never);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    setNotice('Update campaign berhasil dipublikasikan.');
    resetTimelineComposer();
    await loadCampaignUpdates(selectedCampaignId);
  }

  async function handleDeleteCampaign() {
    if (!selectedCampaign) return;

    const confirmed = window.confirm(`Hapus campaign "${selectedCampaign.title}"?`);
    if (!confirmed) return;

    setError(null);
    setNotice(null);

    const { data: donationRows, error: donationsError } = await supabase
      .from('donations')
      .select('id')
      .eq('campaign_id', selectedCampaign.id)
      .limit(1);

    if (donationsError) {
      setError(donationsError.message);
      return;
    }

    const relatedDonations = (donationRows ?? []) as Pick<DonationRow, 'id'>[];
    if (relatedDonations.length > 0) {
      setError('Campaign ini sudah memiliki riwayat donasi dan tidak bisa dihapus langsung.');
      return;
    }

    // Kumpulkan semua URL gambar sebelum menghapus data
    const campaignImageUrls: string[] = [
      ...(selectedCampaign.images ?? []),
      ...(selectedCampaign.image_url ? [selectedCampaign.image_url] : []),
    ];

    // Ambil gambar dari timeline updates
    const { data: updateRows } = await supabase
      .from('campaign_updates')
      .select('image_url')
      .eq('campaign_id', selectedCampaign.id)
      .not('image_url', 'is', null);

    const updateImageUrls = (updateRows ?? [])
      .map((row) => (row as { image_url: string | null }).image_url)
      .filter((url): url is string => Boolean(url));

    const allImageUrls = [...campaignImageUrls, ...updateImageUrls];

    // Hapus data dari database terlebih dahulu
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', selectedCampaign.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    // Bersihkan file dari storage (best-effort, tidak block UI jika gagal)
    if (allImageUrls.length > 0) {
      const result = await deleteFilesFromStorage(allImageUrls);
      console.log(`Storage cleanup: ${result.deleted} dihapus, ${result.failed} gagal`);
    }

    setNotice('Campaign beserta file gambarnya berhasil dihapus.');
    setIsModalOpen(false);
    handleNewCampaign();
    await loadCampaignManager();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Campaign management</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Kelola campaign, tanggal tayang, deskripsi, galeri gambar, dan timeline update dalam satu workspace admin yang rapi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadCampaignManager(selectedCampaignId)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleNewCampaign}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            New campaign
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      ) : null}

      <div className="w-full">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Campaign list</CardTitle>
                <CardDescription className="text-sm text-gray-500">
                  {loading ? 'Loading campaigns...' : `${filteredCampaigns.length} campaign tersedia`}
                </CardDescription>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                {categories.length} categories
              </span>
            </div>
            <input
              type="text"
              value={campaignSearch}
              onChange={(event) => setCampaignSearch(event.target.value)}
              placeholder="Cari campaign..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300"
            />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              <div className="col-span-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Memuat daftar campaign...
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="col-span-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Belum ada campaign yang cocok dengan pencarian.
              </div>
            ) : (
              filteredCampaigns.map((campaign) => {
                const categoryName = campaign.category_id ? categoryMap.get(campaign.category_id)?.name : null;

                return (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => {
                      setSelectedCampaignId(campaign.id);
                      setIsModalOpen(true);
                    }}
                    className="group flex h-full w-full flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-0 text-left shadow-sm transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50/50"
                  >
                    <div className="flex flex-col">
                      <div className="relative aspect-video w-full overflow-hidden bg-gray-50 border-b border-gray-100">
                        {campaign.image_url ? (
                          <img
                            src={campaign.image_url}
                            alt={campaign.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                           <CampaignStatusBadge startDate={campaign.start_date} endDate={campaign.end_date} />
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{categoryName || 'Tanpa kategori'}</p>
                            <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{campaign.title}</p>
                          </div>
                          {campaign.is_featured ? (
                            <div className="flex shrink-0 items-center justify-center rounded-full bg-amber-50 p-1.5 text-amber-600 shadow-sm" title="Featured">
                              <Plus size={10} className="rotate-45" /> 
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-50 bg-gray-50/30 px-4 py-3">
                      <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-gray-400" />
                        {formatDateRange(campaign.start_date, campaign.end_date)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <AdminModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedCampaign ? 'Edit Campaign' : 'Create Campaign'}
          description="Masukkan informasi utama campaign. Form ini mengikuti layout bersih agar tim admin bisa fokus pada konten dan jadwal tayang."
          widthClassName="max-w-4xl"
        >
          <div className="space-y-8 pb-4">
            <form onSubmit={campaignForm.handleSubmit(handleCampaignSubmit)} className="space-y-6">
              <Card className="border-gray-200 bg-white shadow-sm">
              {selectedCampaign ? (
                <div className="px-6 pt-6 pb-2">
                  <CampaignStatusBadge startDate={selectedCampaign.start_date} endDate={selectedCampaign.end_date} />
                </div>
              ) : null}
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      {...campaignForm.register('title')}
                      placeholder="Campaign title"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300"
                    />
                    {campaignForm.formState.errors.title ? <p className="text-xs text-red-600">{campaignForm.formState.errors.title.message}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kategori</label>
                    <select
                      {...campaignForm.register('category_id')}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {campaignForm.formState.errors.category_id ? <p className="text-xs text-red-600">{campaignForm.formState.errors.category_id.message}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Target dana</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      {...campaignForm.register('target_amount', { valueAsNumber: true })}
                      placeholder="Contoh: 150000000"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300"
                    />
                    {campaignForm.formState.errors.target_amount ? <p className="text-xs text-red-600">{campaignForm.formState.errors.target_amount.message}</p> : null}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      Start date
                    </label>
                    <input
                      type="date"
                      {...campaignForm.register('start_date')}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                    />
                    {campaignForm.formState.errors.start_date ? <p className="text-xs text-red-600">{campaignForm.formState.errors.start_date.message}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileClock className="h-4 w-4 text-gray-400" />
                      End date
                    </label>
                    <input
                      type="date"
                      {...campaignForm.register('end_date')}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                    />
                    {campaignForm.formState.errors.end_date ? <p className="text-xs text-red-600">{campaignForm.formState.errors.end_date.message}</p> : null}
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    {...campaignForm.register('is_featured')}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tampilkan di beranda</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Aktifkan featured agar campaign ini bisa muncul di section campaign halaman utama.
                    </p>
                  </div>
                </label>

                <Controller
                  name="description"
                  control={campaignForm.control}
                  render={({ field }) => (
                    <RichTextEditor
                      label="Description"
                      hint="Deskripsi mendukung formatting tulisan (bold, italic, list) untuk membuat halaman campaign lebih menarik."
                      error={campaignForm.formState.errors.description?.message}
                      placeholder="Tulis deskripsi lengkap campaign di sini..."
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <ImageDropzone
                  label="Campaign images"
                  description={`File akan diupload ke bucket ${getCampaignAssetsBucketName()} dan URL-nya disimpan ke kolom images.`}
                  items={campaignImages}
                  onFilesAdd={handleCampaignImageAdd}
                  onRemove={handleCampaignImageRemove}
                />
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-500">
                {selectedCampaign ? `Campaign ID: ${selectedCampaign.id}` : 'Campaign baru akan dibuat setelah disimpan.'}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {selectedCampaign ? (
                  <button
                    type="button"
                    onClick={handleDeleteCampaign}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Hapus
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={campaignForm.formState.isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {campaignForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {campaignForm.formState.isSubmitting ? 'Saving...' : 'Save campaign'}
                </button>
              </div>
            </div>
          </form>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Timeline updates</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Publikasikan update perkembangan campaign dalam format feed yang bersih dan mudah dipindai.
                  </CardDescription>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                  {updates.length} posts
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedCampaign ? (
                <>
                  <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)} className="space-y-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
                    <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Judul update</label>
                        <input
                          type="text"
                          {...updateForm.register('title')}
                          placeholder="Contoh: Progress pembangunan minggu ini"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300"
                        />
                        {updateForm.formState.errors.title ? <p className="text-xs text-red-600">{updateForm.formState.errors.title.message}</p> : null}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tipe update</label>
                        <select
                          {...updateForm.register('update_type')}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        >
                          <option value="General">General</option>
                          <option value="Fundraising Progress">Fundraising Progress</option>
                          <option value="Distribution">Distribution</option>
                        </select>
                        {updateForm.formState.errors.update_type ? <p className="text-xs text-red-600">{updateForm.formState.errors.update_type.message}</p> : null}
                      </div>
                    </div>

                    <Controller
                      name="content"
                      control={updateForm.control}
                      render={({ field }) => (
                        <RichTextEditor
                          label="Konten update"
                          error={updateForm.formState.errors.content?.message}
                          placeholder="Bagikan progres, distribusi bantuan, atau milestones penggalangan dana..."
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />

                    <ImageDropzone
                      label="Gambar pendukung"
                      description="Opsional. Anda bisa menambahkan satu gambar untuk memperkuat update ini."
                      items={timelineImage ? [timelineImage] : []}
                      onFilesAdd={handleTimelineImageAdd}
                      onRemove={handleTimelineImageRemove}
                      multiple={false}
                      emptyHint="Satu gambar opsional untuk update timeline."
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={updateForm.formState.isSubmitting}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updateForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {updateForm.formState.isSubmitting ? 'Saving...' : 'Post update'}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-4">
                    {loadingUpdates ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        Memuat timeline update...
                      </div>
                    ) : updates.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        Belum ada update untuk campaign ini.
                      </div>
                    ) : (
                      updates.map((update) => (
                        <div key={update.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                  {update.update_type}
                                </span>
                                <span className="text-xs text-gray-400">{formatAdminDate(update.created_at, true)}</span>
                              </div>
                              <h3 className="mt-2 text-base font-medium text-gray-900">{update.title}</h3>
                            </div>
                          </div>
                          <div
                            className="prose prose-sm max-w-none mt-3 leading-6 text-gray-600"
                            dangerouslySetInnerHTML={{ __html: update.content }}
                          />
                          {update.image_url ? (
                            <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
                              <img src={update.image_url} alt={update.title} className="h-48 w-full object-cover" />
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  Simpan campaign terlebih dahulu sebelum memposting timeline update.
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </AdminModal>
      </div>

    </div>
  );
}
