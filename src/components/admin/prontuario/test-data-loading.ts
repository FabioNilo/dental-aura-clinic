// Test script: Testar carregamento de dados do Supabase
// Cole este código no console do navegador para verificar se os dados estão sendo carregados
/* eslint-disable @typescript-eslint/no-explicit-any */

(async () => {
  console.log("🧪 Iniciando teste de carregamento de dados...\n");

  // 1. Verificar se supabase client está acessível
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    console.log("✅ Supabase client disponível");

    // 2. Tentar buscar prontuários de um paciente (ajuste o UUID conforme necessário)
    const pacienteId = "seu-uuid-aqui"; // SUBSTITUIR com UUID real
    
    const { data: prontuarios, error: pronError } = await (supabase as any)
      .from("prontuarios")
      .select("*")
      .eq("paciente_id", pacienteId);

    if (pronError) {
      console.error("❌ Erro ao buscar prontuários:", pronError);
    } else {
      console.log(`✅ Prontuários encontrados: ${prontuarios.length}`);
      if (prontuarios.length > 0) {
        console.table(prontuarios[0]);
      }
    }

    // 3. Tentar buscar um prontuário específico
    if (prontuarios.length > 0) {
      const prontuarioId = prontuarios[0].id;
      
      const { data: single, error: singleError } = await (supabase as any)
        .from("prontuarios")
        .select("*")
        .eq("id", prontuarioId)
        .single();

      if (singleError) {
        console.error("❌ Erro ao buscar prontuário específico:", singleError);
      } else {
        console.log("✅ Prontuário específico carregado:");
        console.table(single);
      }
    }

    // 4. Verificar RLS policy
    const { data: { session } } = await supabase.auth.getSession();
    console.log(`✅ Sessão do usuário: ${(session as any)?.user?.email || "não autenticado"}`);
    console.log(`✅ User role: ${(session as any)?.user?.user_metadata?.role || "padrão"}`);

  } catch (err) {
    console.error("❌ Erro:", err);
  }

  console.log("\n🏁 Teste concluído!");
})();
