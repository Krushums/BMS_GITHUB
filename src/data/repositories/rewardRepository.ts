import { supabase } from "@/data/supabase/client";

export async function listActiveRewards(householdId: string) {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("point_cost", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
