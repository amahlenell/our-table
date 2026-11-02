create extension if not exists pgcrypto with schema extensions;
create table public.profiles(id uuid primary key references auth.users on delete cascade, display_name text not null check(length(display_name) between 1 and 100), avatar_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.households(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 100),owner_id uuid not null references public.profiles,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.household_members(household_id uuid not null references public.households on delete cascade,user_id uuid not null references public.profiles on delete cascade,created_at timestamptz not null default now(),primary key(household_id,user_id),unique(user_id));
create table public.household_invitations(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,email text not null,token_hash text not null unique,expires_at timestamptz not null,used_at timestamptz,created_at timestamptz not null default now());
create table public.recipes(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,author_id uuid not null references public.profiles,title text not null check(length(title) between 1 and 160),description text not null default '',category text not null check(category in ('Breakfast','Lunch','Dinner','Snacks','Desserts','Other')),prep_minutes integer not null check(prep_minutes>=0),cook_minutes integer not null check(cook_minutes>=0),servings numeric not null check(servings>0),storage text not null default '',reheat text not null default '',freezing text not null default '',fridge_days integer check(fridge_days between 0 and 30),guidance_source text not null default 'User entered' check(guidance_source in ('User entered','Verified source')),guidance_url text not null default '',source_url text not null default '',author text not null default '',status text not null check(status in ('draft','published')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,household_id));
create table public.food_items(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,name text not null,source text not null check(source in ('USDA','User label')),source_id text,state text not null default '',grams_per_unit jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,household_id));
create table public.food_nutrition(food_id uuid primary key,household_id uuid not null,calories numeric check(calories>=0),protein numeric check(protein>=0),carbs numeric check(carbs>=0),fat numeric check(fat>=0),fibre numeric check(fibre>=0),foreign key(food_id,household_id) references public.food_items(id,household_id) on delete cascade);
create table public.recipe_images(id uuid primary key default gen_random_uuid(),recipe_id uuid not null,household_id uuid not null,storage_path text not null,created_at timestamptz not null default now(),foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade,unique(recipe_id));
create table public.recipe_ingredients(id uuid primary key default gen_random_uuid(),recipe_id uuid not null,household_id uuid not null,food_id uuid,name text not null,quantity numeric not null check(quantity>=0),unit text not null check(unit in ('g','kg','ml','l','cup','tbsp','tsp','piece','serving')),gram_equivalent numeric check(gram_equivalent>=0),position integer not null check(position>=0),foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade,foreign key(food_id,household_id) references public.food_items(id,household_id),unique(recipe_id,position));
create table public.recipe_instructions(id uuid primary key default gen_random_uuid(),recipe_id uuid not null,household_id uuid not null,body text not null,position integer not null check(position>=0),foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade,unique(recipe_id,position));
create table public.recipe_tags(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,name text not null check(length(name) between 1 and 40),unique(household_id,name),unique(id,household_id));
create table public.recipe_tag_assignments(recipe_id uuid not null,tag_id uuid not null,household_id uuid not null,primary key(recipe_id,tag_id),foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade,foreign key(tag_id,household_id) references public.recipe_tags(id,household_id) on delete cascade);
create table public.favourite_recipes(user_id uuid not null,recipe_id uuid not null,household_id uuid not null,created_at timestamptz not null default now(),primary key(user_id,recipe_id),foreign key(household_id,user_id) references public.household_members(household_id,user_id) on delete cascade,foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade);
create table public.recipe_notes(user_id uuid not null,recipe_id uuid not null,household_id uuid not null,notes text not null default '',rating integer not null default 0 check(rating between 0 and 5),updated_at timestamptz not null default now(),primary key(user_id,recipe_id),foreign key(household_id,user_id) references public.household_members(household_id,user_id) on delete cascade,foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade);
create table public.meal_plans(id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households on delete cascade,title text not null,start_date date not null,days integer not null check(days between 3 and 5),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,household_id));
create table public.meal_plan_entries(id uuid primary key default gen_random_uuid(),plan_id uuid not null,household_id uuid not null,recipe_id uuid not null,meal_date date not null,slot text not null check(slot in ('Breakfast','Lunch','Dinner','Snacks')),frozen boolean not null default false,foreign key(plan_id,household_id) references public.meal_plans(id,household_id) on delete cascade,foreign key(recipe_id,household_id) references public.recipes(id,household_id) on delete cascade,unique(id,household_id));
create table public.meal_plan_portions(entry_id uuid not null,household_id uuid not null,user_id uuid not null,quantity numeric not null check(quantity between 0 and 100),primary key(entry_id,user_id),foreign key(entry_id,household_id) references public.meal_plan_entries(id,household_id) on delete cascade,foreign key(household_id,user_id) references public.household_members(household_id,user_id) on delete cascade);
create table public.usage_buckets(user_id uuid not null references auth.users on delete cascade,feature text not null,window_start timestamptz not null,count integer not null,primary key(user_id,feature,window_start));
create function public.is_member(h uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.household_members where household_id=h and user_id=(select auth.uid()))$$;
create function public.profile_visible(p uuid) returns boolean language sql stable security definer set search_path='' as $$select p=(select auth.uid()) or exists(select 1 from public.household_members a join public.household_members b on a.household_id=b.household_id where a.user_id=(select auth.uid()) and b.user_id=p)$$;
alter table public.profiles enable row level security;
create policy profile_read on public.profiles for select to authenticated using(public.profile_visible(id));
create policy profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
alter table public.households enable row level security;
create policy household_read on public.households for select to authenticated using(public.is_member(id));
create policy household_update on public.households for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
alter table public.household_members enable row level security;
create policy members_read on public.household_members for select to authenticated using(public.is_member(household_id));
alter table public.household_invitations enable row level security;
alter table public.usage_buckets enable row level security;
do $$declare t text;begin
 foreach t in array array['recipes','food_items','food_nutrition','recipe_images','recipe_ingredients','recipe_instructions','recipe_tags','recipe_tag_assignments','meal_plans','meal_plan_entries','meal_plan_portions'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy household_access on public.%I for all to authenticated using(public.is_member(household_id)) with check(public.is_member(household_id))',t);
 execute format('create index on public.%I(household_id)',t);end loop;
 foreach t in array array['favourite_recipes','recipe_notes'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy personal_access on public.%I for all to authenticated using(user_id=(select auth.uid()) and public.is_member(household_id)) with check(user_id=(select auth.uid()) and public.is_member(household_id))',t);end loop;
end$$;
create index recipes_recent on public.recipes(household_id,created_at desc);
create index ingredients_recipe on public.recipe_ingredients(recipe_id);
create index instructions_recipe on public.recipe_instructions(recipe_id);
create index entries_plan on public.meal_plan_entries(plan_id);
create index portions_entry on public.meal_plan_portions(entry_id);
create function public.on_signup() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1),'Cook'),100));return new;end$$;
create trigger create_profile after insert on auth.users for each row execute procedure public.on_signup();
create function public.touch_updated() returns trigger language plpgsql set search_path='' as $$begin new.updated_at=now();return new;end$$;
do $$declare t text;begin foreach t in array array['profiles','households','recipes','food_items','recipe_notes','meal_plans'] loop execute format('create trigger touch_updated before update on public.%I for each row execute procedure public.touch_updated()',t);end loop;end$$;
create function public.create_household(p_name text) returns uuid language plpgsql security definer set search_path='' as $$declare h uuid;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if length(trim(p_name)) not between 1 and 100 then raise exception 'Invalid household name';end if;
 insert into public.households(name,owner_id) values(trim(p_name),auth.uid()) returning id into h;
 insert into public.household_members(household_id,user_id) values(h,auth.uid());return h;end$$;
create function public.create_invitation(p_household uuid,p_email text,p_hash text) returns void language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.households where id=p_household and owner_id=auth.uid() for update;
 if not found then raise exception 'Only the household owner can invite';end if;
 if (select count(*) from public.household_members where household_id=p_household)>=2 then raise exception 'Household already has two members';end if;
 if length(p_hash)<>64 or length(p_email)>254 then raise exception 'Invalid invitation';end if;
 update public.household_invitations set used_at=now() where household_id=p_household and used_at is null;
 insert into public.household_invitations(household_id,email,token_hash,expires_at) values(p_household,lower(p_email),p_hash,now()+interval '48 hours');end$$;
create function public.accept_invitation(p_token text) returns uuid language plpgsql security definer set search_path='' as $$declare inv public.household_invitations;email_address text;begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into inv from public.household_invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and used_at is null and expires_at>now() for update;
 if not found then raise exception 'Invitation is invalid or expired';end if;
 select email into email_address from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if lower(email_address) is distinct from inv.email then raise exception 'Sign in with the invited, verified email address';end if;
 perform 1 from public.households where id=inv.household_id for update;
 if (select count(*) from public.household_members where household_id=inv.household_id)>=2 then raise exception 'Household is full';end if;
 insert into public.household_members(household_id,user_id) values(inv.household_id,auth.uid());
 update public.household_invitations set used_at=now() where id=inv.id;return inv.household_id;end$$;
create function public.consume_usage(p_feature text) returns boolean language plpgsql security definer set search_path='' as $$declare n integer;lim integer;w timestamptz:=date_trunc('hour',now());begin
 if auth.uid() is null or p_feature not in ('ai','import','foods') then return false;end if;
 lim=case p_feature when 'ai' then 10 when 'import' then 20 else 120 end;
 insert into public.usage_buckets values(auth.uid(),p_feature,w,1) on conflict(user_id,feature,window_start) do update set count=public.usage_buckets.count+1 returning count into n;
 delete from public.usage_buckets where user_id=auth.uid() and window_start<now()-interval '2 days';return n<=lim;end$$;
-- Atomic replacement: child failures roll back the complete recipe write.
create function public.save_recipe(p_household uuid,p jsonb) returns uuid language plpgsql security invoker set search_path='' as $$declare r uuid:=(p->>'id')::uuid;i jsonb;pos integer;t text;tag uuid;begin
 if not public.is_member(p_household) then raise exception 'Household access denied';end if;
 insert into public.recipes(id,household_id,author_id,title,description,category,prep_minutes,cook_minutes,servings,storage,reheat,freezing,fridge_days,guidance_source,guidance_url,source_url,author,status)
 values(r,p_household,auth.uid(),p->>'title',p->>'description',p->>'category',(p->>'prepMinutes')::int,(p->>'cookMinutes')::int,(p->>'servings')::numeric,p->>'storage',p->>'reheat',p->>'freezing',(p->>'fridgeDays')::int,p->>'guidanceSource',p->>'guidanceUrl',p->>'sourceUrl',p->>'author',p->>'status')
 on conflict(id) do update set title=excluded.title,description=excluded.description,category=excluded.category,prep_minutes=excluded.prep_minutes,cook_minutes=excluded.cook_minutes,servings=excluded.servings,storage=excluded.storage,reheat=excluded.reheat,freezing=excluded.freezing,fridge_days=excluded.fridge_days,guidance_source=excluded.guidance_source,guidance_url=excluded.guidance_url,source_url=excluded.source_url,author=excluded.author,status=excluded.status;
 delete from public.recipe_ingredients where recipe_id=r;pos=0;
 for i in select * from jsonb_array_elements(p->'ingredients') loop insert into public.recipe_ingredients(recipe_id,household_id,food_id,name,quantity,unit,gram_equivalent,position) values(r,p_household,(i->'food'->>'id')::uuid,i->>'name',(i->>'quantity')::numeric,i->>'unit',(i->>'gramEquivalent')::numeric,pos);pos=pos+1;end loop;
 delete from public.recipe_instructions where recipe_id=r;pos=0;
 for i in select * from jsonb_array_elements(p->'instructions') loop insert into public.recipe_instructions(recipe_id,household_id,body,position) values(r,p_household,i#>>'{}',pos);pos=pos+1;end loop;
 delete from public.recipe_tag_assignments where recipe_id=r;
 for t in select distinct jsonb_array_elements_text(p->'tags') loop insert into public.recipe_tags(household_id,name) values(p_household,t) on conflict(household_id,name) do update set name=excluded.name returning id into tag;insert into public.recipe_tag_assignments values(r,tag,p_household);end loop;
 delete from public.recipe_images where recipe_id=r;
 if coalesce(p->>'imagePath','')<>'' then if split_part(p->>'imagePath','/',1)<>p_household::text then raise exception 'Invalid image path';end if;insert into public.recipe_images(recipe_id,household_id,storage_path) values(r,p_household,p->>'imagePath');end if;return r;end$$;
create function public.save_food(p_household uuid,p jsonb) returns uuid language plpgsql security invoker set search_path='' as $$declare f uuid:=(p->>'id')::uuid;begin
 insert into public.food_items(id,household_id,name,source,source_id,state,grams_per_unit) values(f,p_household,p->>'name',p->>'source',p->>'sourceId',p->>'state',coalesce(p->'gramsPerUnit','{}'));
 insert into public.food_nutrition(food_id,household_id,calories,protein,carbs,fat,fibre) values(f,p_household,(p->'per100'->>'calories')::numeric,(p->'per100'->>'protein')::numeric,(p->'per100'->>'carbs')::numeric,(p->'per100'->>'fat')::numeric,(p->'per100'->>'fibre')::numeric);return f;end$$;
create function public.save_plan(p_household uuid,p jsonb) returns uuid language plpgsql security invoker set search_path='' as $$declare plan uuid:=(p->>'id')::uuid;e jsonb;person record;begin
 insert into public.meal_plans(id,household_id,title,start_date,days) values(plan,p_household,p->>'title',(p->>'startDate')::date,(p->>'days')::int) on conflict(id) do update set title=excluded.title,start_date=excluded.start_date,days=excluded.days;
 delete from public.meal_plan_entries where plan_id=plan;
 for e in select * from jsonb_array_elements(p->'entries') loop
 if (e->>'date')::date < (p->>'startDate')::date or (e->>'date')::date >= (p->>'startDate')::date+(p->>'days')::int then raise exception 'Meal outside plan date range';end if;
 insert into public.meal_plan_entries(id,plan_id,household_id,recipe_id,meal_date,slot,frozen) values((e->>'id')::uuid,plan,p_household,(e->>'recipeId')::uuid,(e->>'date')::date,e->>'slot',(e->>'frozen')::boolean);
 for person in select * from jsonb_each_text(e->'portions') loop insert into public.meal_plan_portions values((e->>'id')::uuid,p_household,person.key::uuid,person.value::numeric);end loop;end loop;return plan;end$$;
revoke all on function public.is_member(uuid),public.profile_visible(uuid),public.create_household(text),public.create_invitation(uuid,text,text),public.accept_invitation(text),public.consume_usage(text),public.save_recipe(uuid,jsonb),public.save_food(uuid,jsonb),public.save_plan(uuid,jsonb),public.on_signup(),public.touch_updated() from public;
grant execute on function public.is_member(uuid),public.profile_visible(uuid),public.create_household(text),public.create_invitation(uuid,text,text),public.accept_invitation(text),public.consume_usage(text),public.save_recipe(uuid,jsonb),public.save_food(uuid,jsonb),public.save_plan(uuid,jsonb) to authenticated;
grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('recipe-photos','recipe-photos',false,5242880,array['image/webp']) on conflict(id) do nothing;
create policy photo_read on storage.objects for select to authenticated using(bucket_id='recipe-photos' and public.is_member((storage.foldername(name))[1]::uuid));
create policy photo_insert on storage.objects for insert to authenticated with check(bucket_id='recipe-photos' and public.is_member((storage.foldername(name))[1]::uuid));
create policy photo_delete on storage.objects for delete to authenticated using(bucket_id='recipe-photos' and public.is_member((storage.foldername(name))[1]::uuid));
