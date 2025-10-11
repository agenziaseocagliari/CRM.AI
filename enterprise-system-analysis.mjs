#!/usr/bin/env node

/**
 * ENTERPRISE-LEVEL SYSTEM ANALYSIS
 * Engineering Fellow Deep Debugging Protocol
 * 
 * MISSION: Complete systematic analysis of the data flow pipeline
 * SCOPE: UI → State Management → API Layer → Database → Response Chain
 * GOAL: Identify the EXACT point of failure with precision
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://qjtaqrlpronohgpfdxsi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k';

const supabase = createClient(supabaseUrl, supabaseKey);

class EnterpriseSystemAnalyzer {
    constructor() {
        this.testResults = {
            database: {},
            api: {},
            frontend: {},
            integration: {}
        };
    }

    log(level, section, message, data = null) {
        const timestamp = new Date().toISOString();
        const prefix = {
            'ERROR': '❌',
            'WARN': '⚠️',
            'INFO': 'ℹ️',
            'SUCCESS': '✅',
            'DEBUG': '🔍'
        }[level] || '📊';

        console.log(`${prefix} [${timestamp}] [${section.toUpperCase()}] ${message}`);
        if (data) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
    }

    async analyzeDatabase() {
        this.log('INFO', 'DATABASE', 'Starting database layer analysis...');

        try {
            // 1. Table Schema Analysis
            this.log('DEBUG', 'DATABASE', 'Analyzing forms table schema...');

            const { data: forms, error: formsError } = await supabase
                .from('forms')
                .select('*')
                .limit(3);

            if (formsError) {
                this.log('ERROR', 'DATABASE', 'Failed to query forms table', formsError);
                return { success: false, error: formsError };
            }

            this.log('SUCCESS', 'DATABASE', `Found ${forms.length} forms in database`);

            // 2. Styling Column Analysis
            this.log('DEBUG', 'DATABASE', 'Analyzing styling column structure...');

            const stylingAnalysis = forms.map(form => ({
                id: form.id,
                name: form.name,
                styling: form.styling,
                stylingType: typeof form.styling,
                stylingKeys: form.styling ? Object.keys(form.styling) : [],
                hasCustomColors: form.styling ? (
                    form.styling.primary_color !== '#6366f1' ||
                    form.styling.background_color !== '#ffffff' ||
                    form.styling.text_color !== '#1f2937'
                ) : false
            }));

            this.log('INFO', 'DATABASE', 'Styling analysis results:', stylingAnalysis);

            // 3. Test Raw SQL Update
            this.log('DEBUG', 'DATABASE', 'Testing direct SQL update capability...');

            if (forms.length > 0) {
                const testForm = forms[0];
                const originalStyling = { ...testForm.styling };

                const testStyling = {
                    ...originalStyling,
                    primary_color: '#FF0000',
                    background_color: '#FFF000',
                    text_color: '#000FFF',
                    test_timestamp: Date.now()
                };

                this.log('DEBUG', 'DATABASE', 'Attempting update with test styling...', testStyling);

                const { data: updateResult, error: updateError } = await supabase
                    .from('forms')
                    .update({ styling: testStyling })
                    .eq('id', testForm.id)
                    .select('styling');

                if (updateError) {
                    this.log('ERROR', 'DATABASE', 'Update failed', updateError);
                    return { success: false, error: updateError };
                }

                this.log('SUCCESS', 'DATABASE', 'Update executed successfully');

                // 4. Immediate Verification
                await new Promise(resolve => setTimeout(resolve, 100));

                const { data: verifyForm, error: verifyError } = await supabase
                    .from('forms')
                    .select('styling')
                    .eq('id', testForm.id)
                    .single();

                if (verifyError) {
                    this.log('ERROR', 'DATABASE', 'Verification query failed', verifyError);
                    return { success: false, error: verifyError };
                }

                this.log('DEBUG', 'DATABASE', 'Verification result:', verifyForm.styling);

                // 5. Critical Analysis: Compare what we sent vs what we got
                const comparison = {
                    sent_primary: testStyling.primary_color,
                    received_primary: verifyForm.styling?.primary_color,
                    sent_background: testStyling.background_color,
                    received_background: verifyForm.styling?.background_color,
                    sent_test_timestamp: testStyling.test_timestamp,
                    received_test_timestamp: verifyForm.styling?.test_timestamp,
                    exact_match: JSON.stringify(testStyling) === JSON.stringify(verifyForm.styling)
                };

                this.log('INFO', 'DATABASE', 'Update comparison analysis:', comparison);

                if (comparison.exact_match) {
                    this.log('SUCCESS', 'DATABASE', '✅ DATABASE LAYER IS WORKING CORRECTLY');
                    this.testResults.database = { success: true, issue: 'NONE' };
                } else {
                    this.log('ERROR', 'DATABASE', '❌ DATABASE LAYER IS CORRUPTING DATA');
                    this.testResults.database = {
                        success: false,
                        issue: 'DATA_CORRUPTION',
                        details: comparison
                    };
                }

                // 6. Restore original styling
                await supabase
                    .from('forms')
                    .update({ styling: originalStyling })
                    .eq('id', testForm.id);
            }

            return { success: true };

        } catch (error) {
            this.log('ERROR', 'DATABASE', 'Database analysis failed', error);
            return { success: false, error };
        }
    }

    async analyzeFrontendDataFlow() {
        this.log('INFO', 'FRONTEND', 'Starting frontend data flow analysis...');

        this.log('DEBUG', 'FRONTEND', 'Analyzing Forms.tsx handleStyleChange implementation...');

        try {
            const formsPath = '/workspaces/CRM.AI/src/components/Forms.tsx';
            const formsContent = fs.readFileSync(formsPath, 'utf8');

            // Extract handleStyleChange function
            const handleStyleChangeMatch = formsContent.match(
                /const handleStyleChange = useCallback\(async \(newStyle: FormStyle\) => \{([\s\S]*?)\}, \[.*?\]\);/
            );

            if (handleStyleChangeMatch) {
                const functionBody = handleStyleChangeMatch[1];

                this.log('DEBUG', 'FRONTEND', 'handleStyleChange function found');

                // Analyze the implementation
                const analysis = {
                    hasSupabaseUpdate: functionBody.includes('supabase'),
                    hasLocalStorage: functionBody.includes('localStorage'),
                    hasErrorHandling: functionBody.includes('try') && functionBody.includes('catch'),
                    hasToastFeedback: functionBody.includes('toast'),
                    hasRefetch: functionBody.includes('refetchData'),
                    usesFormToModify: functionBody.includes('formToModify')
                };

                this.log('INFO', 'FRONTEND', 'Frontend implementation analysis:', analysis);

                if (!analysis.hasSupabaseUpdate) {
                    this.log('ERROR', 'FRONTEND', 'handleStyleChange missing Supabase update call');
                    this.testResults.frontend = { success: false, issue: 'MISSING_SUPABASE_UPDATE' };
                } else if (!analysis.usesFormToModify) {
                    this.log('ERROR', 'FRONTEND', 'handleStyleChange not using formToModify correctly');
                    this.testResults.frontend = { success: false, issue: 'MISSING_FORM_CONTEXT' };
                } else {
                    this.log('SUCCESS', 'FRONTEND', 'Frontend implementation looks correct');
                    this.testResults.frontend = { success: true, issue: 'NONE' };
                }
            } else {
                this.log('ERROR', 'FRONTEND', 'handleStyleChange function not found in Forms.tsx');
                this.testResults.frontend = { success: false, issue: 'FUNCTION_NOT_FOUND' };
            }

        } catch (error) {
            this.log('ERROR', 'FRONTEND', 'Failed to analyze frontend code', error);
            this.testResults.frontend = { success: false, error };
        }
    }

    async analyzeEdgeFunctionIntegration() {
        this.log('INFO', 'INTEGRATION', 'Starting edge function integration analysis...');

        try {
            // Test the generate-form-fields function that creates forms with styling
            const testPayload = {
                prompt: "Test form for styling analysis",
                required_fields: ["Email", "Nome", "privacy_consent", "marketing_consent"],
                metadata: {
                    gdpr_required: true,
                    marketing_consent: true
                },
                colors: {
                    primary: "#FF6B35",
                    background: "#FFF8F0",
                    text: "#8B2635"
                }
            };

            this.log('DEBUG', 'INTEGRATION', 'Testing edge function with custom colors...', testPayload);

            const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('generate-form-fields', {
                body: testPayload
            });

            if (edgeError) {
                this.log('ERROR', 'INTEGRATION', 'Edge function failed', edgeError);
                this.testResults.integration = { success: false, error: edgeError };
                return;
            }

            this.log('SUCCESS', 'INTEGRATION', 'Edge function executed successfully');

            // Analyze the response
            const responseAnalysis = {
                hasFields: !!edgeResult.fields && Array.isArray(edgeResult.fields),
                fieldsCount: edgeResult.fields?.length || 0,
                hasStyleCustomizations: !!edgeResult.style_customizations,
                hasMarketingField: edgeResult.fields?.some(f => f.name === 'marketing_consent'),
                styleData: edgeResult.style_customizations
            };

            this.log('INFO', 'INTEGRATION', 'Edge function response analysis:', responseAnalysis);

            if (responseAnalysis.hasMarketingField) {
                this.log('SUCCESS', 'INTEGRATION', '✅ Marketing field generation is working');
            } else {
                this.log('ERROR', 'INTEGRATION', '❌ Marketing field not generated despite metadata.marketing_consent: true');
            }

            if (responseAnalysis.hasStyleCustomizations) {
                this.log('SUCCESS', 'INTEGRATION', '✅ Style customizations are being generated');
            } else {
                this.log('ERROR', 'INTEGRATION', '❌ Style customizations not generated despite colors input');
            }

            this.testResults.integration = {
                success: true,
                details: responseAnalysis
            };

        } catch (error) {
            this.log('ERROR', 'INTEGRATION', 'Integration analysis failed', error);
            this.testResults.integration = { success: false, error };
        }
    }

    async generateDiagnosticReport() {
        this.log('INFO', 'REPORT', 'Generating comprehensive diagnostic report...');

        const report = {
            timestamp: new Date().toISOString(),
            analysis_level: 'ENTERPRISE_ENGINEERING_FELLOW',
            test_results: this.testResults,
            root_cause_analysis: {},
            recommended_actions: []
        };

        // Root cause analysis based on test results
        if (!this.testResults.database.success) {
            report.root_cause_analysis.primary = 'DATABASE_LAYER_FAILURE';
            report.root_cause_analysis.details = 'Database is not persisting styling updates correctly';
            report.recommended_actions.push('Fix database constraints, triggers, or RLS policies');
        } else if (!this.testResults.frontend.success) {
            report.root_cause_analysis.primary = 'FRONTEND_IMPLEMENTATION_FAILURE';
            report.root_cause_analysis.details = 'Frontend code is not calling database updates correctly';
            report.recommended_actions.push('Fix handleStyleChange implementation in Forms.tsx');
        } else if (!this.testResults.integration.success) {
            report.root_cause_analysis.primary = 'INTEGRATION_LAYER_FAILURE';
            report.root_cause_analysis.details = 'Edge functions or API integration issues';
            report.recommended_actions.push('Fix edge function integration or API layer');
        } else {
            report.root_cause_analysis.primary = 'SYSTEMIC_CONFIGURATION_ISSUE';
            report.root_cause_analysis.details = 'All layers appear functional individually - likely configuration or timing issue';
            report.recommended_actions.push('Deep dive into system configuration and data flow timing');
        }

        this.log('INFO', 'REPORT', 'DIAGNOSTIC REPORT COMPLETE');
        console.log('\n' + '='.repeat(80));
        console.log('ENTERPRISE DIAGNOSTIC REPORT');
        console.log('='.repeat(80));
        console.log(JSON.stringify(report, null, 2));
        console.log('='.repeat(80));

        return report;
    }

    async executeFullAnalysis() {
        this.log('INFO', 'SYSTEM', 'Starting enterprise-level system analysis...');

        await this.analyzeDatabase();
        await this.analyzeFrontendDataFlow();
        await this.analyzeEdgeFunctionIntegration();

        const report = await this.generateDiagnosticReport();

        this.log('SUCCESS', 'SYSTEM', 'Enterprise analysis complete');
        return report;
    }
}

// Execute the analysis
const analyzer = new EnterpriseSystemAnalyzer();
analyzer.executeFullAnalysis().catch(console.error);