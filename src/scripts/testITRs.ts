
import { supabase } from "@/integrations/supabase/client";

export const createTestITRs = async (count: number = 10) => {
  try {
    const { data: subsystems, error: subsystemsError } = await supabase
      .from("subsystems")
      .select("id, name, system_id")
      .limit(10);

    if (subsystemsError) throw subsystemsError;
    if (!subsystems || subsystems.length === 0) {
      throw new Error("No subsystems found. Please create subsystems first.");
    }

    const status = ["complete", "inprogress", "delayed"];
    const itrNames = [
      "Mechanical Test",
      "Electrical Test",
      "Pressure Test",
      "Flow Test",
      "Temperature Test",
      "Vibration Test",
      "Safety Test",
      "Performance Test",
      "Endurance Test",
      "Integration Test"
    ];

    const itrs = [];
    for (let i = 0; i < count; i++) {
      const randomSubsystem = subsystems[Math.floor(Math.random() * subsystems.length)];
      const randomStatus = status[Math.floor(Math.random() * status.length)];
      const randomProgress = randomStatus === "complete" ? 100 : Math.floor(Math.random() * 100);
      const randomQuantity = Math.floor(Math.random() * 10) + 1;
      const randomITRName = itrNames[Math.floor(Math.random() * itrNames.length)];

      const now = new Date();
      const startDate = new Date();
      startDate.setDate(now.getDate() - Math.floor(Math.random() * 30));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) + 15);

      itrs.push({
        name: `${randomITRName} ${i + 1}`,
        subsystem_id: randomSubsystem.id,
        status: randomStatus,
        progress: randomProgress,
        quantity: randomQuantity,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
    }

    const { data, error } = await supabase
      .from("itrs")
      .insert(itrs)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating test ITRs:", error);
    throw error;
  }
};

export default createTestITRs;
