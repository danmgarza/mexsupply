insert into public.capabilities (name, slug) values
  ('CNC machining', 'cnc-machining'),
  ('Injection molding', 'injection-molding'),
  ('Die casting', 'die-casting'),
  ('Stamping', 'stamping'),
  ('Sheet metal', 'sheet-metal'),
  ('Welding', 'welding')
on conflict (slug) do nothing;

insert into public.industries (name, slug) values
  ('Automotive', 'automotive'),
  ('Aerospace', 'aerospace'),
  ('Electronics', 'electronics'),
  ('Medical', 'medical'),
  ('Industrial', 'industrial')
on conflict (slug) do nothing;

insert into public.materials (name, slug) values
  ('Aluminum', 'aluminum'),
  ('Steel', 'steel'),
  ('Stainless steel', 'stainless-steel'),
  ('Copper', 'copper'),
  ('Plastics', 'plastics')
on conflict (slug) do nothing;

insert into public.certifications (name, slug) values
  ('ISO 9001', 'iso-9001'),
  ('IATF 16949', 'iatf-16949'),
  ('AS9100', 'as9100')
on conflict (slug) do nothing;
