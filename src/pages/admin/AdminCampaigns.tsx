import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarDays,
  FileClock,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import CampaignStatusBadge from '../../components/admin/campaigns/CampaignStatusBadge';
import ImageDropzone from '../../components/admin/campaigns/ImageDropzone';
import RichTextEditor from '../../components/admin/campaigns/RichTextEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import AdminModal from '../../components/admin/AdminModal';
import {
  CampaignManagerValues,
  CampaignUpdateValues,
  campaignManagerSchema,
  campaignUpdateSchema,
} from '../../lib/admin-schemas';
import {
  defaultCampaignValues,
  defaultUpdateValues,
  formatDateRange,
  slugify,
  toExistingImageItems,
} from '../../lib/admin-campaign-utils';
import { getCampaignImages } from '../../lib/public-campaigns';
import { formatAdminDate } from '../../lib/admin-helpers';
import {
  deleteCampaign,
  deleteCampaignUpdate,
  fetchCampaignDonationProbe,
  fetchCampaignDonationRows,
  fetchCampaignManagerRows,
  fetchCampaignUpdateImageRows,
  fetchCampaignUpdateRows,
  insertCampaignUpdate,
  saveCampaign,
} from '../../lib/admin-repository';
import { logError } from '../../lib/error-logger';
import type { ImagePreviewItem } from '../../lib/image-preview';
import { revokeQueuedItems } from '../../lib/image-preview';
import { useImagePreviewList } from '../../hooks/useImagePreviewList';
import { deleteFilesFromStorage, getCampaignAssetsBucketName, uploadFileToStorage } from '../../lib/supabase-storage';
import {
  CampaignInsert,
  CampaignRow,
  CampaignUpdateInsert,
  CampaignUpdateRow,
  CategoryRow,
  DonationRow,
} from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdateRow[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignSearch, setCampaignSearch] = useState('');
  const campaignImageList = useImagePreviewList();
  const timelineImageList = useImagePreviewList();
  
  const campaignImages = campaignImageList.items;
  const timelineImages = timelineImageList.items;

  const handleCampaignImageAdd = campaignImageList.addFiles;
  const handleCampaignImageRemove = campaignImageList.removeItem;
  const handleCampaignImageReorder = campaignImageList.reorderItems;
  const handleCampaignImageCropReplace = campaignImageList.cropReplace;
  const handleTimelineImageAdd = timelineImageList.addFiles;
  const handleTimelineImageRemove = timelineImageList.removeItem;
  const handleTimelineImageReorder = timelineImageList.reorderItems;
  const handleTimelineImageCropReplace = timelineImageList.cropReplace;

  const [collabLogos, setCollabLogos] = useState<Record<string, { file?: File; previewUrl: string }>>({});
  const [loading, setLoading] = useState(true);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'detail' | 'mitra' | 'updates' | 'donatur'>('detail');
  const [modalDonations, setModalDonations] = useState<DonationRow[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);

  const campaignForm = useForm<CampaignManagerValues>({
    resolver: zodResolver(campaignManagerSchema),
    defaultValues: defaultCampaignValues,
  });

  const { fields: collabFields, append: appendCollab, remove: removeCollab } = useFieldArray({
    control: campaignForm.control,
    name: 'collaborators',
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

    const [{ data: campaignRows, error: campaignsError }, { data: categoryRows, error: categoriesError }] = await fetchCampaignManagerRows();

    if (campaignsError || categoriesError) {
      logError('AdminCampaigns.loadCampaignManager', campaignsError ?? categoriesError, {
        campaignsError,
        categoriesError,
      });
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

    const { data, error: updatesError } = await fetchCampaignUpdateRows(campaignId);

    if (updatesError) {
      logError('AdminCampaigns.loadCampaignUpdates', updatesError, { campaignId });
      setError(updatesError.message);
      setUpdates([]);
      setLoadingUpdates(false);
      return;
    }

    setUpdates(data ?? []);
    setLoadingUpdates(false);
  }


  async function loadCampaignDonations(campaignId: string) {
    setLoadingDonations(true);
    const { data, error: fetchError } = await fetchCampaignDonationRows(campaignId);

    if (fetchError) {
      logError('AdminCampaigns.loadCampaignDonations', fetchError, { campaignId });
    }

    if (!fetchError) {
      setModalDonations(data ?? []);
    }
    setLoadingDonations(false);
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
      status: campaign?.status ?? 'draft',
      collaborators: campaign?.collaborators ?? [],
    });

    campaignImageList.resetItems(toExistingImageItems(getCampaignImages(campaign)));

    setCollabLogos({});
  }

  function resetTimelineComposer() {
    updateForm.reset(defaultUpdateValues);
    timelineImageList.resetItems([]);
  }

  function handleNewCampaign() {
    setNotice(null);
    setError(null);
    setSelectedCampaignId(null);
    setUpdates([]);
    setCollabLogos({});
    resetCampaignEditor(null);
    resetTimelineComposer();
    setIsModalOpen(true);
  }

  function handleCollabLogoChange(index: number, file: File) {
    const id = collabFields[index].id;
    const previewUrl = URL.createObjectURL(file);
    
    setCollabLogos(prev => {
      if (prev[id]?.previewUrl && !prev[id].previewUrl.startsWith('http')) {
        URL.revokeObjectURL(prev[id].previewUrl);
      }
      return { ...prev, [id]: { file, previewUrl } };
    });
    
    // Tandai bahwa ada perubahan (kita biarkan validator meloloskan string non-url sementara)
    campaignForm.setValue(`collaborators.${index}.avatar`, 'PENDING_UPLOAD', { shouldDirty: true });
  }

  useEffect(() => {
    loadCampaignManager();
    return () => {
      revokeQueuedItems(campaignImages);
      revokeQueuedItems(timelineImages);
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
    loadCampaignDonations(selectedCampaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, selectedCampaign]);

  async function handleCampaignSubmit(values: CampaignManagerValues) {
    setError(null);
    setNotice(null);

    try {
      const existingUrls = campaignImages
        .filter((item) => item.kind === 'existing')
        .map((item) => item.url);

      const oldUrls = selectedCampaign?.images ?? [];
      const removedUrls = oldUrls.filter((url) => !existingUrls.includes(url));

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
          logError('AdminCampaigns.uploadCampaignImages', uploadError, {
            queuedCount: queuedItems.length,
          });
          setError(`Gagal mengupload gambar: ${uploadError instanceof Error ? uploadError.message : 'Periksa koneksi dan pastikan storage bucket sudah dibuat.'}`);
          return;
        }
      }

      // ─── UPLOAD LOGO MITRA (NEW) ───
      const updatedCollaborators = [...values.collaborators];
      for (let i = 0; i < updatedCollaborators.length; i++) {
        const collabId = collabFields[i].id;
        const logoData = collabLogos[collabId];
        
        if (logoData?.file) {
          try {
            const logoUrl = await uploadFileToStorage(logoData.file, {
              bucket: getCampaignAssetsBucketName(),
              folder: 'partners',
            });
            updatedCollaborators[i].avatar = logoUrl;
          } catch (err) {
            console.error('Failed to upload partner logo:', err);
          }
        }
      }

      const imageUrls = [...existingUrls, ...freshUploads];
      const categoryName = categoryMap.get(values.category_id)?.name ?? null;

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
        status: values.status,
        collaborators: updatedCollaborators,
        current_amount: selectedCampaign?.current_amount ?? 0,
      };

      const { data, error: submitError } = await saveCampaign(payload, selectedCampaign?.id);

      if (submitError) {
        logError('AdminCampaigns.submitCampaign', submitError, {
          mode: selectedCampaign ? 'edit' : 'create',
          campaignId: selectedCampaign?.id,
          slug,
        });
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

      if (removedUrls.length > 0) {
        deleteFilesFromStorage(removedUrls).catch((err) => {
          logError('AdminCampaigns.cleanupRemovedImages', err);
        });
      }

      await loadCampaignManager(nextId);
      setIsModalOpen(false);
    } catch (unexpectedError) {
      logError('AdminCampaigns.handleCampaignSubmitUnexpected', unexpectedError, {
        campaignId: selectedCampaign?.id,
      });
      setError(`Terjadi kesalahan: ${unexpectedError instanceof Error ? unexpectedError.message : 'Silakan coba lagi.'}`);
    }
  }

  async function handleUpdateSubmit(values: CampaignUpdateValues) {
    if (!selectedCampaignId) return;

    setError(null);
    setNotice(null);

    const queuedFiles = timelineImages
      .filter((item) => item.kind === 'queued' && item.file)
      .map((item) => item.file!);

    let uploadedUrls: string[] = [];
    if (queuedFiles.length > 0) {
      try {
        const uploadPromises = queuedFiles.map((file) =>
          uploadFileToStorage(file, {
            bucket: getCampaignAssetsBucketName(),
            folder: 'campaign-updates',
          })
        );
        uploadedUrls = await Promise.all(uploadPromises);
      } catch (err) {
        logError('AdminCampaigns.handleUpdateSubmitUpload', err);
        setError('Gagal mengupload gambar timeline. Silakan coba lagi.');
        return;
      }
    }

    const payload: CampaignUpdateInsert = {
      campaign_id: selectedCampaignId,
      title: values.title.trim(),
      content: values.content.trim(),
      update_type: values.update_type,
      image_url: uploadedUrls[0] ?? null,
      images: uploadedUrls.length > 0 ? uploadedUrls : null,
      ...(values.created_at ? { created_at: new Date(values.created_at).toISOString() } : {}),
    };

    const { error: submitError } = await insertCampaignUpdate(payload);

    if (submitError) {
      logError('AdminCampaigns.handleUpdateSubmit', submitError, {
        campaignId: selectedCampaignId,
      });
      setError(submitError.message);
      return;
    }

    setNotice('Update campaign berhasil dipublikasikan.');
    resetTimelineComposer();
    await loadCampaignUpdates(selectedCampaignId);
  }

  async function handleDeleteUpdate(updateId: string, title: string, imageUrl: string | null, images: string[] | null) {
    if (!selectedCampaignId) return;

    const confirmed = window.confirm(`Hapus update timeline "${title}"?`);
    if (!confirmed) return;

    setError(null);
    setNotice(null);

    const { error: deleteError } = await deleteCampaignUpdate(updateId);

    if (deleteError) {
      logError('AdminCampaigns.handleDeleteUpdate', deleteError, { updateId });
      setError(deleteError.message);
      return;
    }

    const urlsToDelete: string[] = [];
    if (imageUrl) urlsToDelete.push(imageUrl);
    if (images && images.length > 0) urlsToDelete.push(...images);

    if (urlsToDelete.length > 0) {
      deleteFilesFromStorage(urlsToDelete).catch((err) => {
        logError('AdminCampaigns.handleDeleteUpdateStorage', err, { urlsToDelete });
      });
    }

    setNotice('Update timeline berhasil dihapus.');
    await loadCampaignUpdates(selectedCampaignId);
  }

  async function handleDeleteCampaign() {
    if (!selectedCampaign) return;

    const confirmed = window.confirm(`Hapus campaign "${selectedCampaign.title}"?`);
    if (!confirmed) return;

    setError(null);
    setNotice(null);

    const { data: donationRows, error: donationsError } = await fetchCampaignDonationProbe(selectedCampaign.id);

    if (donationsError) {
      logError('AdminCampaigns.checkRelatedDonationsBeforeDelete', donationsError, {
        campaignId: selectedCampaign.id,
      });
      setError(donationsError.message);
      return;
    }

    const relatedDonations = (donationRows ?? []) as Pick<DonationRow, 'id'>[];
    if (relatedDonations.length > 0) {
      logError('AdminCampaigns.deleteCampaignBlockedByDonations', new Error('Campaign memiliki riwayat donasi.'), {
        campaignId: selectedCampaign.id,
        donationCount: relatedDonations.length,
      });
      setError('Campaign ini sudah memiliki riwayat donasi dan tidak bisa dihapus langsung.');
      return;
    }

    // Kumpulkan semua URL gambar sebelum menghapus data
    const campaignImageUrls: string[] = [
      ...(selectedCampaign.images ?? []),
      ...(selectedCampaign.image_url ? [selectedCampaign.image_url] : []),
    ];

    // Ambil gambar dari timeline updates
    const { data: updateRows, error: updateImagesError } = await fetchCampaignUpdateImageRows(selectedCampaign.id);

    if (updateImagesError) {
      logError('AdminCampaigns.loadUpdateImagesBeforeDelete', updateImagesError, {
        campaignId: selectedCampaign.id,
      });
    }

    const updateImageUrls = (updateRows ?? [])
      .map((row) => (row as { image_url: string | null }).image_url)
      .filter((url): url is string => Boolean(url));

    const allImageUrls = [...campaignImageUrls, ...updateImageUrls];

    // Hapus data dari database terlebih dahulu
    const { error: deleteError } = await deleteCampaign(selectedCampaign.id);

    if (deleteError) {
      logError('AdminCampaigns.deleteCampaign', deleteError, {
        campaignId: selectedCampaign.id,
      });
      setError(deleteError.message);
      return;
    }

    // Bersihkan file dari storage (best-effort, tidak block UI jika gagal)
    if (allImageUrls.length > 0) {
      const result = await deleteFilesFromStorage(allImageUrls);
      if (result.failed > 0) {
        logError('AdminCampaigns.storageCleanupAfterDelete', new Error('Sebagian file storage gagal dihapus.'), {
          campaignId: selectedCampaign.id,
          deleted: result.deleted,
          failed: result.failed,
        });
      }
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
          widthClassName="max-w-4xl"
          headerActions={
            <div className="flex items-center gap-1.5 mr-2">
              {selectedCampaign ? (
                <>
                  <a
                    href={`/campaigns/${selectedCampaign.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Preview Campaign"
                    className="rounded-md p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    type="button"
                    onClick={handleDeleteCampaign}
                    title="Hapus Campaign"
                    className="rounded-md p-2 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : null}
              <button
                type="submit"
                form="campaign-edit-form"
                disabled={campaignForm.formState.isSubmitting}
                title="Save Campaign"
                className="rounded-md p-2 text-emerald-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
              >
                {campaignForm.formState.isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              </button>
            </div>
          }
        >
          <div className="flex gap-6 border-b border-gray-200 mb-6">
            {(['detail', 'mitra', 'updates', 'donatur'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveModalTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  activeModalTab === tab ? 'text-zinc-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'detail' ? 'Detail & Target' : tab === 'mitra' ? 'Mitra Kolaborator' : tab === 'updates' ? 'Timeline Updates' : 'Daftar Donatur'}
                {activeModalTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-8 pb-4">
            <form id="campaign-edit-form" onSubmit={campaignForm.handleSubmit(handleCampaignSubmit)}>
              {/* ─── TAB DETAIL ─── */}
              <div className={activeModalTab === 'detail' ? 'block' : 'hidden'}>
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
                        {campaignForm.formState.errors.title && <p className="text-xs text-red-600">{campaignForm.formState.errors.title.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Kategori</label>
                        <select
                          {...campaignForm.register('category_id')}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        >
                          <option value="">Pilih kategori</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                        {campaignForm.formState.errors.category_id && <p className="text-xs text-red-600">{campaignForm.formState.errors.category_id.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Target dana</label>
                        <input
                          type="number"
                          {...campaignForm.register('target_amount', { valueAsNumber: true })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        />
                        {campaignForm.formState.errors.target_amount && <p className="text-xs text-red-600">{campaignForm.formState.errors.target_amount.message}</p>}
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <CalendarDays className="h-4 w-4 text-gray-400" /> Start date
                        </label>
                        <input
                          type="date"
                          {...campaignForm.register('start_date')}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <FileClock className="h-4 w-4 text-gray-400" /> End date
                        </label>
                        <input
                          type="date"
                          {...campaignForm.register('end_date')}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2 pt-4 border-t border-gray-50">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status Publikasi</label>
                        <select
                          {...campaignForm.register('status')}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        >
                          <option value="draft">Draft (Sembunyikan)</option>
                          <option value="active">Active (Tayang)</option>
                          <option value="completed">Completed (Selesai)</option>
                        </select>
                      </div>
                      <div className="flex items-center h-full pt-8">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            {...campaignForm.register('is_featured')}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700">Tampilkan di beranda (Featured)</span>
                        </label>
                      </div>
                    </div>

                    <Controller
                      name="description"
                      control={campaignForm.control}
                      render={({ field }) => (
                        <RichTextEditor
                          label="Description"
                          value={field.value}
                          onChange={field.onChange}
                          error={campaignForm.formState.errors.description?.message}
                        />
                      )}
                    />

                    <ImageDropzone
                      label="Campaign images"
                      items={campaignImages}
                      onFilesAdd={handleCampaignImageAdd}
                      onRemove={handleCampaignImageRemove}
                      onReorder={handleCampaignImageReorder}
                      onCropReplace={handleCampaignImageCropReplace}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* ─── TAB MITRA ─── */}
              <div className={activeModalTab === 'mitra' ? 'block' : 'hidden'}>
                <Card className="border-gray-200 bg-white shadow-sm">
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Mitra Kolaborator</h3>
                        <p className="text-xs text-gray-500 mt-1">Logo mitra akan tampil berjalan (marquee) di halaman publik.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendCollab({ id: crypto.randomUUID(), name: '', role: '', quote: '', avatar: '', url: '' })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100"
                      >
                        <Plus size={14} /> Tambah Mitra
                      </button>
                    </div>

                    <div className="space-y-4">
                      {collabFields.map((field, index) => (
                        <div key={field.id} className="relative rounded-xl border border-gray-200 bg-gray-50 p-5">
                          <button
                            type="button"
                            onClick={() => removeCollab(index)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center justify-center border-r border-gray-100 pr-6 min-w-[120px]">
                              <label className="text-xs font-medium text-gray-700 mb-3">Logo Mitra</label>
                              <div className="relative group">
                                <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 bg-white overflow-hidden flex items-center justify-center transition-colors group-hover:border-emerald-400">
                                  {collabLogos[field.id]?.previewUrl || field.avatar ? (
                                    <img 
                                      src={collabLogos[field.id]?.previewUrl || field.avatar || ''} 
                                      className="h-full w-full object-contain p-2" 
                                      alt="Preview"
                                    />
                                  ) : (
                                    <ImageIcon className="text-gray-300" size={24} />
                                  )}
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleCollabLogoChange(index, file);
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                  <RefreshCw className="text-white animate-spin-slow" size={16} />
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium">Klik untuk upload</p>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-2 flex-1">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Nama Mitra *</label>
                                <input
                                  {...campaignForm.register(`collaborators.${index}.name`)}
                                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">Peran *</label>
                                <input
                                  {...campaignForm.register(`collaborators.${index}.role`)}
                                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-medium text-gray-700">Pesan / Quote *</label>
                                <textarea
                                  {...campaignForm.register(`collaborators.${index}.quote`)}
                                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm min-h-[80px]"
                                />
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-medium text-gray-700">Link Mitra (Instagram/Web)</label>
                                <input
                                  {...campaignForm.register(`collaborators.${index}.url`)}
                                  placeholder="https://..."
                                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </form>
          </div>

          <div className={activeModalTab === 'updates' ? 'block' : 'hidden'}>
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Timeline updates</CardTitle>
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
                    <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px]">
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
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tanggal Kejadian</label>
                        <input
                          type="date"
                          {...updateForm.register('created_at')}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-gray-300"
                        />
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
                      label="Galeri update"
                      description="Tambahkan satu atau beberapa gambar dokumentasi untuk memperkuat update ini."
                      items={timelineImages}
                      onFilesAdd={handleTimelineImageAdd}
                      onRemove={handleTimelineImageRemove}
                      onReorder={handleTimelineImageReorder}
                      onCropReplace={handleTimelineImageCropReplace}
                      multiple={true}
                      emptyHint="Drop beberapa gambar di sini untuk galeri update."
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
                        <div key={update.id} className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleDeleteUpdate(update.id, update.title, update.image_url, update.images)}
                            title="Hapus Update"
                            className="absolute top-3 right-3 rounded-md p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="flex flex-wrap items-center gap-2 mb-1 pr-8">
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                              {update.update_type}
                            </span>
                            <span className="text-[11px] text-gray-400">{formatAdminDate(update.created_at, true)}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 pr-8">{update.title}</h3>
                          <div className="flex flex-col gap-3 mt-2">
                            {update.images && update.images.length > 0 ? (
                              <div className={`grid gap-2 ${update.images.length === 1 ? 'grid-cols-1' : update.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                {update.images.map((imgUrl, i) => (
                                  <div key={i} className={`relative overflow-hidden rounded-md border border-gray-100 bg-gray-50 ${update.images!.length === 3 && i === 0 ? 'col-span-2 sm:col-span-1' : ''} ${update.images!.length === 1 ? 'aspect-video' : 'aspect-square sm:aspect-video'}`}>
                                    <img src={imgUrl} alt={`${update.title} ${i + 1}`} className="h-full w-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : update.image_url ? (
                              <div className="relative w-full aspect-video overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                                <img src={update.image_url} alt={update.title} className="h-full w-full object-cover" />
                              </div>
                            ) : null}
                            <div
                              className="prose prose-sm max-w-none leading-relaxed text-gray-700 [&_img]:hidden [&_p]:my-0 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold"
                              dangerouslySetInnerHTML={{ __html: update.content }}
                            />
                          </div>
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

          {activeModalTab === 'donatur' && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Daftar Donatur</CardTitle>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                    {modalDonations.length} donatur
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDonations ? (
                  <div className="py-8 text-center text-sm text-gray-500">Memuat donatur...</div>
                ) : modalDonations.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">Belum ada donatur untuk campaign ini.</div>
                ) : (
                  <div className="space-y-4">
                    {modalDonations.map((donation) => (
                      <div key={donation.id} className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-gray-900">{donation.is_anonymous ? 'Orang Baik' : donation.donor_name}</p>
                          <p className="text-sm text-gray-500">{new Date(donation.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          {donation.message && (
                            <p className="mt-2 text-sm italic text-gray-600">"{donation.message}"</p>
                          )}
                        </div>
                        <span className="font-bold text-emerald-600">{formatCurrency(donation.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </AdminModal>
      </div>
    </div>
  );
}
