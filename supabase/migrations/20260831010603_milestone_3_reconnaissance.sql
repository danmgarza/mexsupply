alter table public.companies
  add column if not exists website_domain text,
  add column if not exists normalized_phone text;

create index if not exists companies_website_domain_idx on public.companies (website_domain);
create index if not exists companies_normalized_phone_idx on public.companies (normalized_phone);
create index if not exists companies_employee_size_band_idx on public.companies (employee_size_band);
