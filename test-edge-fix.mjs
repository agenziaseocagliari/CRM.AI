// Test the fixed Edge Function with questionnaire colors
const testData = {
    prompt: "Test form with custom colors",
    organization_id: "2aab4d72-ca5b-438f-93ac-b4c2fe2f8353",
    required_fields: ["Nome completo", "Email", "Telefono", "Servizi interesse"],
    style_customizations: {
        primary_color: "#f264d3",    // From questionnaire
        background_color: "#0840af", // From questionnaire
        text_color: "#1f2937"
    },
    metadata: {
        gdpr_required: true,
        marketing_consent: true
    },
    privacy_policy_url: "https://seo-cagliari.it/"
};

console.log("🧪 TESTING Edge Function with questionnaire colors...");
console.log("📤 INPUT style_customizations:", testData.style_customizations);

async function testEdgeFunction() {
    try {
        const response = await fetch("https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/generate-form-fields", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        console.log("✅ RESPONSE STATUS:", response.status);
        console.log("📥 FULL RESPONSE:", JSON.stringify(result, null, 2));
        console.log("📥 OUTPUT style_customizations:", result.style_customizations);
        console.log("🎨 COLOR COMPARISON:");
        console.log("  INPUT primary:", testData.style_customizations.primary_color);
        console.log("  OUTPUT primary (camelCase):", result.style_customizations?.primaryColor);
        console.log("  OUTPUT primary (snake_case):", result.style_customizations?.primary_color);
        console.log("  INPUT background:", testData.style_customizations.background_color);
        console.log("  OUTPUT background (camelCase):", result.style_customizations?.backgroundColor);
        console.log("  OUTPUT background (snake_case):", result.style_customizations?.background_color);
        console.log("✅ COLORS MATCH (snake_case):",
            result.style_customizations?.primary_color === testData.style_customizations.primary_color &&
            result.style_customizations?.background_color === testData.style_customizations.background_color
        );

        if (result.fields && result.fields.length > 0) {
            console.log("📋 GENERATED FIELDS:", result.fields.map(f => f.name).join(", "));
        }

    } catch (error) {
        console.error("❌ TEST FAILED:", error);
    }
}

testEdgeFunction();