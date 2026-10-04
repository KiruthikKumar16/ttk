-- Migration: Add Google Form URL and Sheet URL to assessments table
-- Supports integration with Google Forms for automated quiz distribution and grading.

alter table public.assessments
  add column if not exists form_url text,
  add column if not exists sheet_url text;
