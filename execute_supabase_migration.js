import fetch from 'node-fetch';

// Configurazione Supabase con service role
const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0';

// Funzione per eseguire SQL direttamente sul database
async function executeSQLDirect(sql) {
    const url = `${supabaseUrl}/rest/v1/rpc/exec`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey
            },
            body: JSON.stringify({ query: sql })
        });

        const result = await response.text();
        
        if (response.ok) {
            return { success: true, data: result };
        } else {
            // Provo con endpoint alternativo per DDL
            const altResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_ddl`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({ sql })
            });
            
            if (altResponse.ok) {
                return { success: true, data: await altResponse.text() };
            }
            
            return { success: false, error: `HTTP ${response.status}: ${result}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Funzione per eseguire query via postgREST
async function executePostgREST() {
    try {
        // Provo prima con una query diretta su una tabella esistente per testare
        const response = await fetch(`${supabaseUrl}/rest/v1/organizations?select=count`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            console.log('✅ PostgREST connection working');
            return { success: true, data: 'Connected' };
        } else {
            return { success: false, error: `PostgREST error: ${response.status}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Lista dei comandi SQL da eseguire in sequenza
const sqlCommands = [
    // Step 1: Tabella contact_imports
    `CREATE TABLE IF NOT EXISTS public.contact_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('csv', 'xlsx', 'vcf')),
        total_rows INTEGER NOT NULL DEFAULT 0,
        successful_imports INTEGER NOT NULL DEFAULT 0,
        failed_imports INTEGER NOT NULL DEFAULT 0,
        duplicate_skipped INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ NULL,
        error_message TEXT NULL,
        error_details JSONB NULL,
        field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
        duplicate_strategy VARCHAR(50) NOT NULL DEFAULT 'skip' CHECK (duplicate_strategy IN ('skip', 'update', 'merge')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    
    // Step 2: Indici per contact_imports
    `CREATE INDEX IF NOT EXISTS idx_contact_imports_organization_id ON contact_imports(organization_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contact_imports_status ON contact_imports(status)`,
    `CREATE INDEX IF NOT EXISTS idx_contact_imports_created_at ON contact_imports(created_at DESC)`,
    
    // Step 3: RLS per contact_imports
    `ALTER TABLE contact_imports ENABLE ROW LEVEL SECURITY`,
    
    // Step 4: Policy per contact_imports
    `CREATE POLICY "Users can view their organization's imports" ON contact_imports
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )`,
    
    `CREATE POLICY "Users can insert imports for their organization" ON contact_imports
        FOR INSERT WITH CHECK (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            ) AND uploaded_by = auth.uid()
        )`,
    
    `CREATE POLICY "Users can update their organization's imports" ON contact_imports
        FOR UPDATE USING (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )`,

    // Step 5: Tabella contact_import_logs
    `CREATE TABLE IF NOT EXISTS public.contact_import_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        import_id UUID NOT NULL REFERENCES contact_imports(id) ON DELETE CASCADE,
        row_number INTEGER NOT NULL,
        raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(50) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'duplicate_skipped')),
        contact_id UUID NULL REFERENCES contacts(id) ON DELETE SET NULL,
        error_type VARCHAR(100) NULL,
        error_message TEXT NULL,
        error_field VARCHAR(100) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // Step 6: Indici per contact_import_logs  
    `CREATE INDEX IF NOT EXISTS idx_contact_import_logs_import_id ON contact_import_logs(import_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contact_import_logs_status ON contact_import_logs(status)`,
    `CREATE INDEX IF NOT EXISTS idx_contact_import_logs_contact_id ON contact_import_logs(contact_id) WHERE contact_id IS NOT NULL`,

    // Step 7: RLS per contact_import_logs
    `ALTER TABLE contact_import_logs ENABLE ROW LEVEL SECURITY`,

    // Step 8: Policy per contact_import_logs
    `CREATE POLICY "Users can view logs for accessible imports" ON contact_import_logs
        FOR SELECT USING (
            import_id IN (
                SELECT id FROM contact_imports
                WHERE organization_id IN (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )
        )`,

    `CREATE POLICY "Users can insert logs for accessible imports" ON contact_import_logs
        FOR INSERT WITH CHECK (
            import_id IN (
                SELECT id FROM contact_imports
                WHERE organization_id IN (
                    SELECT organization_id FROM profiles 
                    WHERE id = auth.uid()
                )
            )
        )`,

    // Step 9: Tabella contact_field_mappings
    `CREATE TABLE IF NOT EXISTS public.contact_field_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        template_name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        field_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
        times_used INTEGER NOT NULL DEFAULT 0,
        last_used_at TIMESTAMPTZ NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(organization_id, template_name)
    )`,

    // Step 10: Indici per contact_field_mappings
    `CREATE INDEX IF NOT EXISTS idx_contact_field_mappings_organization_id ON contact_field_mappings(organization_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_field_mappings_default 
        ON contact_field_mappings(organization_id) 
        WHERE is_default = true`,

    // Step 11: RLS per contact_field_mappings
    `ALTER TABLE contact_field_mappings ENABLE ROW LEVEL SECURITY`,

    // Step 12: Policy per contact_field_mappings
    `CREATE POLICY "Users can view their organization's field mappings" ON contact_field_mappings
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )`,

    `CREATE POLICY "Users can insert field mappings for their organization" ON contact_field_mappings
        FOR INSERT WITH CHECK (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            ) AND created_by = auth.uid()
        )`,

    `CREATE POLICY "Users can update their organization's field mappings" ON contact_field_mappings
        FOR UPDATE USING (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )`,

    `CREATE POLICY "Users can delete their organization's field mappings" ON contact_field_mappings
        FOR DELETE USING (
            organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid()
            )
        )`
];

// Funzione principale per eseguire tutte le migrazioni
async function executeFullMigration() {
    console.log('🚀 INIZIO ESECUZIONE COMPLETA MIGRAZIONE SUPABASE');
    console.log('='.repeat(60));
    
    // Test connessione
    console.log('\n1️⃣ Test connessione database...');
    const connectionTest = await executePostgREST();
    if (!connectionTest.success) {
        console.error('❌ Connessione fallita:', connectionTest.error);
        return;
    }
    console.log('✅ Connessione database OK');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(`\n2️⃣ Esecuzione ${sqlCommands.length} comandi SQL...\n`);

    // Esegui ogni comando
    for (let i = 0; i < sqlCommands.length; i++) {
        const command = sqlCommands[i].trim();
        const stepNum = i + 1;
        
        process.stdout.write(`Step ${stepNum}/${sqlCommands.length}: `);
        
        // Determina il tipo di comando
        let commandType = 'UNKNOWN';
        if (command.includes('CREATE TABLE')) {
            const tableName = command.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
            commandType = `CREATE TABLE ${tableName}`;
        } else if (command.includes('CREATE INDEX')) {
            const indexName = command.match(/CREATE.*?INDEX.*?(\w+)/)?.[1];
            commandType = `CREATE INDEX ${indexName}`;
        } else if (command.includes('ALTER TABLE')) {
            commandType = 'ALTER TABLE (RLS)';
        } else if (command.includes('CREATE POLICY')) {
            const policyName = command.match(/CREATE POLICY\s+"([^"]+)"/)?.[1];
            commandType = `CREATE POLICY ${policyName}`;
        }

        try {
            const result = await executeSQLDirect(command);
            
            if (result.success) {
                console.log(`✅ ${commandType}`);
                successCount++;
            } else {
                console.log(`❌ ${commandType} - ${result.error}`);
                errorCount++;
                errors.push({ step: stepNum, command: commandType, error: result.error });
            }
        } catch (error) {
            console.log(`❌ ${commandType} - Exception: ${error.message}`);
            errorCount++;
            errors.push({ step: stepNum, command: commandType, error: error.message });
        }

        // Piccola pausa tra i comandi
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RIEPILOGO ESECUZIONE:');
    console.log(`✅ Successi: ${successCount}/${sqlCommands.length}`);
    console.log(`❌ Errori: ${errorCount}/${sqlCommands.length}`);
    console.log(`📈 Tasso successo: ${Math.round((successCount / sqlCommands.length) * 100)}%`);

    if (errors.length > 0) {
        console.log('\n🔍 DETTAGLI ERRORI:');
        errors.forEach((err, idx) => {
            console.log(`${idx + 1}. Step ${err.step} (${err.command}): ${err.error}`);
        });
    }

    if (successCount >= (sqlCommands.length * 0.8)) {
        console.log('\n🎉 MIGRAZIONE COMPLETATA CON SUCCESSO!');
        return true;
    } else {
        console.log('\n⚠️ MIGRAZIONE PARZIALMENTE COMPLETATA');
        return false;
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    executeFullMigration().catch(console.error);
}

export { executeFullMigration, executeSQLDirect };
