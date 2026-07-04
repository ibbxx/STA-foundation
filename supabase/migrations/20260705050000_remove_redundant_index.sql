-- ============================================================
-- Migration: Remove Redundant Index on volunteer_registrations
-- ============================================================
-- Indeks "idx_volunteer_registrations_program" pada kolom (program_id) redundan
-- karena sudah dicakup oleh indeks komposit:
-- 1. "idx_volunteer_registrations_type_program" (program_id, registration_type)
-- 2. "idx_volunteer_registrations_program_created_at_desc" (program_id, created_at DESC)
-- ============================================================

DROP INDEX IF EXISTS public.idx_volunteer_registrations_program;
