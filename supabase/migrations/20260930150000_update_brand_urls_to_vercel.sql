-- ══════════════════════════════════════════════════════════════════════════
-- Migration: Update Brand URLs to Vercel Deployment
-- Sets canonical website URL and verify base URL to https://ttk-lemon.vercel.app
-- ══════════════════════════════════════════════════════════════════════════

update public.brand_settings
set website_url = 'https://ttk-lemon.vercel.app',
    verify_base_url = 'https://ttk-lemon.vercel.app'
where id = 'default';

alter table public.brand_settings
  alter column website_url set default 'https://ttk-lemon.vercel.app',
  alter column verify_base_url set default 'https://ttk-lemon.vercel.app';
