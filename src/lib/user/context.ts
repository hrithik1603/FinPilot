import { supabase } from '@/lib/supabase';
import { UserContext } from '@/lib/ai/build-system-prompt';

export async function getUserContext(userId: string): Promise<UserContext | null> {
  const { data, error } = await supabase
    .from('user_context')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user context:', error);
    }
    return null;
  }

  return {
    name: data.name,
    role: data.role as any,
    industry: data.industry,
    companySize: data.company_size as any,
    country: data.country,
    preferredDetailLevel: data.preferred_detail_level as any,
    frequentModules: data.frequent_modules,
  };
}

export async function updateUserContext(userId: string, context: Partial<UserContext>) {
  const updates = {
    user_id: userId,
    name: context.name,
    role: context.role,
    industry: context.industry,
    company_size: context.companySize,
    country: context.country,
    preferred_detail_level: context.preferredDetailLevel,
    frequent_modules: context.frequentModules,
    updated_at: new Date().toISOString(),
  };

  // Clean undefined values
  Object.keys(updates).forEach(key => updates[key as keyof typeof updates] === undefined && delete updates[key as keyof typeof updates]);

  const { error } = await supabase
    .from('user_context')
    .upsert(updates);

  if (error) {
    console.error('Error updating user context:', error);
    return false;
  }
  return true;
}
