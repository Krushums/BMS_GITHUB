import { supabase } from "@/data/supabase/client";

export async function listTaskAssignmentsForChild(childId: string) {
  const { data, error } = await supabase
    .from("task_assignments")
    .select("*, tasks(*)")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
