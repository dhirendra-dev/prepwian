ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS account_verification_required boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.create_account_verification_for_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare _required boolean;
begin
  if coalesce(new.is_guest, false) = false and coalesce(new.is_bot, false) = false then
    select coalesce((select account_verification_required from public.app_settings order by id limit 1), true) into _required;
    if _required then
      insert into public.account_verifications(user_id, status) values (new.id, 'PENDING')
      on conflict (user_id) do nothing;
    else
      insert into public.account_verifications(user_id, status, verified_at, verification_source)
      values (new.id, 'VERIFIED', now(), 'auto_mode_off')
      on conflict (user_id) do nothing;
    end if;
  end if;
  return new;
end;
$function$;

-- Security: restrict institute reference tables to admins
DROP POLICY IF EXISTS "Authenticated users can view student festivals" ON public.jee_student_festivals;
CREATE POLICY "Admins can view student festivals" ON public.jee_student_festivals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view surrounding services" ON public.jee_surrounding_services;
CREATE POLICY "Admins can view surrounding services" ON public.jee_surrounding_services FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated users can view seat pressure metrics" ON public.jee_seat_pressure_metrics;
CREATE POLICY "Admins can view seat pressure metrics" ON public.jee_seat_pressure_metrics FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));