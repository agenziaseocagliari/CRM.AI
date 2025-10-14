// DIRECT SOURCE CODE TEST
// Test the exact same logic that runs in production

// Simulate the PipelineStage enum from types.ts
const PipelineStage = {
    NewLead: 'New Lead',
    Contacted: 'Contacted', 
    ProposalSent: 'Proposal Sent',
    Won: 'Won',
    Lost: 'Lost',
};

// Simulate the groupOpportunitiesByStage function from useCrmData.ts
const groupOpportunitiesByStage = (opportunities) => {
    console.log('🗂️ PIPELINE DEBUG: Grouping opportunities by stage, input:', opportunities);
    
    const emptyData = {
        [PipelineStage.NewLead]: [],
        [PipelineStage.Contacted]: [],
        [PipelineStage.ProposalSent]: [],
        [PipelineStage.Won]: [],
        [PipelineStage.Lost]: [],
    };

    if (!opportunities || opportunities.length === 0) { 
        console.log('⚠️ PIPELINE DEBUG: No opportunities to group, returning empty data');
        return emptyData; 
    }

    const grouped = opportunities.reduce((acc, op) => {
        console.log(`📌 PIPELINE DEBUG: Processing opportunity "${op.contact_name}" with stage "${op.stage}"`);
        
        if (acc[op.stage]) {
            acc[op.stage].push(op);
            console.log(`✅ PIPELINE DEBUG: Added to stage "${op.stage}", now has ${acc[op.stage].length} opportunities`);
        } else {
            console.error(`❌ PIPELINE DEBUG: Unknown stage "${op.stage}" for opportunity "${op.contact_name}"`);
            console.log('Available stages:', Object.keys(emptyData));
        }
        return acc;
    }, emptyData);
    
    console.log('🎯 PIPELINE DEBUG: Final grouped opportunities:', grouped);
    return grouped;
};

// Test scenarios based on our previous fixes
console.log('🧪 TESTING PIPELINE DATA FLOW');
console.log('=============================\n');

// TEST 1: Empty opportunities (what component sees if no data)
console.log('TEST 1: Empty opportunities array');
console.log('--------------------------------');
const emptyResult = groupOpportunitiesByStage([]);
console.log('Result total opportunities:', Object.values(emptyResult).flat().length);
console.log('');

// TEST 2: Null/undefined opportunities (what component sees if query fails)
console.log('TEST 2: Null opportunities');
console.log('-------------------------');
const nullResult = groupOpportunitiesByStage(null);
console.log('Result total opportunities:', Object.values(nullResult).flat().length);
console.log('');

// TEST 3: Opportunity with correct "New Lead" stage (post-fix scenario)
console.log('TEST 3: Opportunity with correct "New Lead" stage');
console.log('------------------------------------------------');
const correctOpportunity = [{
    id: '123',
    contact_name: 'Test Contact',
    stage: 'New Lead',  // This should match PipelineStage.NewLead
    value: 5000,
    organization_id: 'org-123'
}];
const correctResult = groupOpportunitiesByStage(correctOpportunity);
console.log('Result total opportunities:', Object.values(correctResult).flat().length);
console.log('New Lead stage count:', correctResult[PipelineStage.NewLead].length);
console.log('');

// TEST 4: Opportunity with old incorrect "Lead" stage (pre-fix scenario)
console.log('TEST 4: Opportunity with incorrect "Lead" stage');
console.log('----------------------------------------------');
const incorrectOpportunity = [{
    id: '124',
    contact_name: 'Test Contact 2',
    stage: 'Lead',  // This should NOT match any stage
    value: 3000,
    organization_id: 'org-123'
}];
const incorrectResult = groupOpportunitiesByStage(incorrectOpportunity);
console.log('Result total opportunities:', Object.values(incorrectResult).flat().length);
console.log('New Lead stage count:', incorrectResult[PipelineStage.NewLead].length);
console.log('');

// TEST 5: Mixed stages (what a healthy pipeline should look like)
console.log('TEST 5: Multiple opportunities with various stages');
console.log('------------------------------------------------');
const mixedOpportunities = [
    {
        id: '125',
        contact_name: 'Contact A',
        stage: 'New Lead',
        value: 2000,
        organization_id: 'org-123'
    },
    {
        id: '126', 
        contact_name: 'Contact B',
        stage: 'Contacted',
        value: 4000,
        organization_id: 'org-123'
    },
    {
        id: '127',
        contact_name: 'Contact C', 
        stage: 'Won',
        value: 8000,
        organization_id: 'org-123'
    }
];
const mixedResult = groupOpportunitiesByStage(mixedOpportunities);
console.log('Result total opportunities:', Object.values(mixedResult).flat().length);
Object.entries(mixedResult).forEach(([stage, opps]) => {
    console.log(`  ${stage}: ${opps.length} opportunities`);
});
console.log('');

// DIAGNOSIS SUMMARY
console.log('🎯 DIAGNOSIS SUMMARY');
console.log('===================');
console.log('✅ Grouping function works correctly when:');
console.log('   - Opportunities array is provided');
console.log('   - Stage values match PipelineStage enum exactly');
console.log('');
console.log('❌ Pipeline shows 0 when:');
console.log('   - Opportunities array is empty []');
console.log('   - Opportunities is null/undefined');
console.log('   - Stage values don\'t match enum (old "Lead" vs "New Lead")');
console.log('');
console.log('🔍 IF PRODUCTION STILL SHOWS 0 AFTER DATABASE FIX:');
console.log('   1. useCrmData hook is receiving empty array from API');
console.log('   2. Organization context is wrong (user seeing different org)');
console.log('   3. RLS policies blocking the query');
console.log('   4. Authentication/JWT issues');
console.log('   5. Component state not updating after data loads');

// Test the exact enum values
console.log('');
console.log('📋 ENUM VALUES CHECK');
console.log('===================');
console.log('PipelineStage.NewLead =', `"${PipelineStage.NewLead}"`);
console.log('PipelineStage.Contacted =', `"${PipelineStage.Contacted}"`);
console.log('PipelineStage.ProposalSent =', `"${PipelineStage.ProposalSent}"`);
console.log('PipelineStage.Won =', `"${PipelineStage.Won}"`);
console.log('PipelineStage.Lost =', `"${PipelineStage.Lost}"`);