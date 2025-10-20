/**
 * Risk Scoring Service
 * 
 * Advanced algorithm for calculating insurance risk scores based on:
 * - Health factors (age, BMI, smoking, medical conditions)
 * - Financial stability (income, assets, debts, employment)
 * - Lifestyle risks (hobbies, travel, driving record)
 * 
 * @module riskScoringService
 */

// ================================================================
// TYPE DEFINITIONS
// ================================================================

export interface HealthFactors {
  age: number;
  height_cm: number;
  weight_kg: number;
  smoking_status: 'never' | 'former' | 'current' | 'occasional';
  alcohol_consumption?: 'none' | 'occasional' | 'moderate' | 'heavy';
  preexisting_conditions: Array<{
    name: string;
    since: string;
    controlled: boolean;
  }>;
  physical_activity_level: 'sedentary' | 'light' | 'moderate' | 'intense';
  last_medical_checkup?: Date;
}

export interface FinancialFactors {
  annual_income_eur: number;
  total_assets_eur: number;
  total_debts_eur: number;
  employment_status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  employment_stability_years: number;
  homeowner: boolean;
}

export interface LifestyleFactors {
  risky_hobbies: string[];
  travel_frequency_per_year: number;
  extreme_sports: boolean;
  high_risk_destinations: string[];
  driving_record: 'clean' | 'minor_violations' | 'major_violations' | 'accidents';
  daily_commute_km: number;
}

export interface RiskScores {
  health_score: number;
  financial_score: number;
  lifestyle_score: number;
  total_risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'very_high';
}

export interface ProductRecommendation {
  type: 'auto' | 'home' | 'life' | 'health' | 'travel' | 'liability';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_premium_eur: number;
  coverage_amount_eur: number;
  reason: string;
  exclusions?: string[];
}

// ================================================================
// CONSTANTS
// ================================================================

const WEIGHTS = {
  HEALTH: 0.4,
  FINANCIAL: 0.3,
  LIFESTYLE: 0.3,
};

const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 85,
};

const HIGH_RISK_CONDITIONS = [
  'diabetes',
  'heart_disease',
  'cancer',
  'stroke',
  'hypertension',
  'copd',
  'kidney_disease',
];

const HIGH_RISK_HOBBIES = [
  'skydiving',
  'base_jumping',
  'rock_climbing',
  'motorcycling',
  'scuba_diving',
  'mountaineering',
  'racing',
];

const HIGH_RISK_DESTINATIONS = [
  'war_zone',
  'high_crime_area',
  'extreme_weather_region',
];

// ================================================================
// HEALTH SCORE CALCULATION (0-100)
// Lower score = Higher risk
// ================================================================

export function calculateHealthScore(factors: HealthFactors): number {
  // Age factor (0-100, higher age = higher risk)
  const ageFactor = calculateAgeFactor(factors.age);
  
  // BMI factor
  const bmi = factors.weight_kg / Math.pow(factors.height_cm / 100, 2);
  const bmiFactor = calculateBMIFactor(bmi);
  
  // Smoking factor
  const smokingFactor = calculateSmokingFactor(factors.smoking_status);
  
  // Preexisting conditions factor
  const conditionsFactor = calculateConditionsFactor(factors.preexisting_conditions);
  
  // Physical activity bonus
  const activityBonus = calculateActivityBonus(factors.physical_activity_level);
  
  // Alcohol consumption factor
  const alcoholFactor = calculateAlcoholFactor(factors.alcohol_consumption);
  
  // Weighted calculation
  const healthScore = (
    (100 - ageFactor) * 0.25 +
    (100 - bmiFactor) * 0.20 +
    (100 - smokingFactor) * 0.25 +
    (100 - conditionsFactor) * 0.20 +
    activityBonus * 0.05 +
    (100 - alcoholFactor) * 0.05
  );
  
  return Math.max(0, Math.min(100, Math.round(healthScore * 100) / 100));
}

function calculateAgeFactor(age: number): number {
  // Age risk increases exponentially after 50
  if (age < 30) return 10;
  if (age < 40) return 20;
  if (age < 50) return 35;
  if (age < 60) return 50;
  if (age < 70) return 70;
  return 85;
}

function calculateBMIFactor(bmi: number): number {
  // Optimal BMI: 18.5-24.9
  if (bmi < 18.5) return 30; // Underweight
  if (bmi < 25) return 10;   // Normal
  if (bmi < 30) return 25;   // Overweight
  if (bmi < 35) return 50;   // Obese Class I
  if (bmi < 40) return 70;   // Obese Class II
  return 90;                 // Obese Class III
}

function calculateSmokingFactor(status: string): number {
  switch (status) {
    case 'never': return 5;
    case 'former': return 20;
    case 'occasional': return 50;
    case 'current': return 80;
    default: return 30;
  }
}

function calculateConditionsFactor(conditions: Array<{ name: string; controlled: boolean }>): number {
  if (conditions.length === 0) return 5;
  
  let totalRisk = 0;
  conditions.forEach(condition => {
    const isHighRisk = HIGH_RISK_CONDITIONS.some(hrc => 
      condition.name.toLowerCase().includes(hrc)
    );
    
    if (isHighRisk) {
      totalRisk += condition.controlled ? 30 : 60;
    } else {
      totalRisk += condition.controlled ? 15 : 30;
    }
  });
  
  return Math.min(90, totalRisk);
}

function calculateActivityBonus(level: string): number {
  switch (level) {
    case 'intense': return 100;
    case 'moderate': return 80;
    case 'light': return 50;
    case 'sedentary': return 20;
    default: return 50;
  }
}

function calculateAlcoholFactor(consumption?: string): number {
  switch (consumption) {
    case 'none': return 5;
    case 'occasional': return 15;
    case 'moderate': return 35;
    case 'heavy': return 70;
    default: return 20;
  }
}

// ================================================================
// FINANCIAL SCORE CALCULATION (0-100)
// Lower score = Higher risk
// ================================================================

export function calculateFinancialScore(factors: FinancialFactors): number {
  // Income stability factor
  const incomeFactor = calculateIncomeFactor(factors.annual_income_eur, factors.employment_status);
  
  // Asset wealth factor
  const assetFactor = calculateAssetFactor(factors.total_assets_eur);
  
  // Debt ratio factor
  const debtRatio = factors.total_debts_eur / Math.max(1, factors.annual_income_eur);
  const debtFactor = calculateDebtFactor(debtRatio);
  
  // Employment stability bonus
  const stabilityBonus = Math.min(20, factors.employment_stability_years * 2);
  
  // Homeownership bonus
  const homeownerBonus = factors.homeowner ? 10 : 0;
  
  // Weighted calculation
  const financialScore = (
    incomeFactor * 0.35 +
    assetFactor * 0.30 +
    (100 - debtFactor) * 0.25 +
    stabilityBonus * 0.05 +
    homeownerBonus * 0.05
  );
  
  return Math.max(0, Math.min(100, Math.round(financialScore * 100) / 100));
}

function calculateIncomeFactor(income: number, employment: string): number {
  // Base income score
  let incomeScore = 0;
  if (income < 20000) incomeScore = 30;
  else if (income < 40000) incomeScore = 50;
  else if (income < 60000) incomeScore = 70;
  else if (income < 100000) incomeScore = 85;
  else incomeScore = 95;
  
  // Employment status modifier
  const employmentModifier = {
    'employed': 1.0,
    'self_employed': 0.85,
    'retired': 0.9,
    'student': 0.6,
    'unemployed': 0.3,
  }[employment] || 0.5;
  
  return incomeScore * employmentModifier;
}

function calculateAssetFactor(assets: number): number {
  if (assets < 10000) return 20;
  if (assets < 50000) return 40;
  if (assets < 100000) return 60;
  if (assets < 250000) return 75;
  if (assets < 500000) return 85;
  return 95;
}

function calculateDebtFactor(debtRatio: number): number {
  // Debt-to-income ratio risk
  if (debtRatio < 0.2) return 10;
  if (debtRatio < 0.4) return 25;
  if (debtRatio < 0.6) return 45;
  if (debtRatio < 1.0) return 65;
  return 85;
}

// ================================================================
// LIFESTYLE SCORE CALCULATION (0-100)
// Lower score = Higher risk
// ================================================================

export function calculateLifestyleScore(factors: LifestyleFactors): number {
  // Risky activities factor
  const hobbiesFactor = calculateHobbiesFactor(factors.risky_hobbies, factors.extreme_sports);
  
  // Travel frequency factor
  const travelFactor = calculateTravelFactor(
    factors.travel_frequency_per_year,
    factors.high_risk_destinations
  );
  
  // Driving record factor
  const drivingFactor = calculateDrivingFactor(
    factors.driving_record,
    factors.daily_commute_km
  );
  
  // Weighted calculation
  const lifestyleScore = (
    (100 - hobbiesFactor) * 0.40 +
    (100 - travelFactor) * 0.30 +
    (100 - drivingFactor) * 0.30
  );
  
  return Math.max(0, Math.min(100, Math.round(lifestyleScore * 100) / 100));
}

function calculateHobbiesFactor(hobbies: string[], extremeSports: boolean): number {
  if (hobbies.length === 0 && !extremeSports) return 10;
  
  let riskScore = extremeSports ? 40 : 0;
  
  hobbies.forEach(hobby => {
    const isHighRisk = HIGH_RISK_HOBBIES.some(hrh => 
      hobby.toLowerCase().includes(hrh)
    );
    riskScore += isHighRisk ? 20 : 10;
  });
  
  return Math.min(90, riskScore);
}

function calculateTravelFactor(frequency: number, destinations: string[]): number {
  let travelRisk = 0;
  
  // Frequency risk
  if (frequency > 10) travelRisk += 30;
  else if (frequency > 5) travelRisk += 20;
  else if (frequency > 2) travelRisk += 10;
  else travelRisk += 5;
  
  // Destination risk
  destinations.forEach(dest => {
    const isHighRisk = HIGH_RISK_DESTINATIONS.some(hrd => 
      dest.toLowerCase().includes(hrd)
    );
    travelRisk += isHighRisk ? 30 : 5;
  });
  
  return Math.min(80, travelRisk);
}

function calculateDrivingFactor(record: string, commute: number): number {
  let drivingRisk = 0;
  
  // Driving record
  switch (record) {
    case 'clean': drivingRisk = 10; break;
    case 'minor_violations': drivingRisk = 30; break;
    case 'major_violations': drivingRisk = 60; break;
    case 'accidents': drivingRisk = 80; break;
    default: drivingRisk = 25;
  }
  
  // Daily commute adds risk
  if (commute > 100) drivingRisk += 20;
  else if (commute > 50) drivingRisk += 10;
  else if (commute > 20) drivingRisk += 5;
  
  return Math.min(90, drivingRisk);
}

// ================================================================
// TOTAL RISK SCORE & CATEGORY
// ================================================================

export function calculateTotalRiskScore(
  healthScore: number,
  financialScore: number,
  lifestyleScore: number
): RiskScores {
  // Weighted total (inverted because lower component scores = higher risk)
  // Convert to risk scale: high score = low risk → low risk score
  const healthRisk = 100 - healthScore;
  const financialRisk = 100 - financialScore;
  const lifestyleRisk = 100 - lifestyleScore;
  
  const totalRisk = (
    healthRisk * WEIGHTS.HEALTH +
    financialRisk * WEIGHTS.FINANCIAL +
    lifestyleRisk * WEIGHTS.LIFESTYLE
  );
  
  const total_risk_score = Math.round(totalRisk * 100) / 100;
  
  // Determine category
  let risk_category: 'low' | 'medium' | 'high' | 'very_high';
  if (total_risk_score <= RISK_THRESHOLDS.LOW) {
    risk_category = 'low';
  } else if (total_risk_score <= RISK_THRESHOLDS.MEDIUM) {
    risk_category = 'medium';
  } else if (total_risk_score <= RISK_THRESHOLDS.HIGH) {
    risk_category = 'high';
  } else {
    risk_category = 'very_high';
  }
  
  return {
    health_score: healthScore,
    financial_score: financialScore,
    lifestyle_score: lifestyleScore,
    total_risk_score,
    risk_category,
  };
}

// ================================================================
// PRODUCT RECOMMENDATION ENGINE
// ================================================================

export function generateProductRecommendations(
  scores: RiskScores,
  healthFactors: HealthFactors,
  financialFactors: FinancialFactors,
  lifestyleFactors: LifestyleFactors
): ProductRecommendation[] {
  const recommendations: ProductRecommendation[] = [];
  const { total_risk_score, risk_category } = scores;
  
  // === AUTO INSURANCE ===
  if (lifestyleFactors.daily_commute_km > 0 || lifestyleFactors.driving_record !== 'clean') {
    const autoPriority = lifestyleFactors.driving_record === 'accidents' ? 'critical' : 
                        lifestyleFactors.driving_record === 'major_violations' ? 'high' : 'medium';
    
    const basePremium = 600;
    const riskMultiplier = total_risk_score / 50;
    const drivingMultiplier = {
      'clean': 1.0,
      'minor_violations': 1.3,
      'major_violations': 1.8,
      'accidents': 2.5,
    }[lifestyleFactors.driving_record] || 1.5;
    
    recommendations.push({
      type: 'auto',
      priority: autoPriority,
      estimated_premium_eur: Math.round(basePremium * riskMultiplier * drivingMultiplier),
      coverage_amount_eur: 1000000,
      reason: lifestyleFactors.driving_record !== 'clean' 
        ? 'Storia di guida problematica richiede copertura completa'
        : 'Protezione essenziale per spostamenti quotidiani',
      exclusions: lifestyleFactors.driving_record === 'accidents' 
        ? ['Guida sotto influenza', 'Gare non autorizzate'] 
        : undefined,
    });
  }
  
  // === HOME INSURANCE ===
  if (financialFactors.homeowner) {
    recommendations.push({
      type: 'home',
      priority: 'high',
      estimated_premium_eur: Math.round(400 + (financialFactors.total_assets_eur / 1000)),
      coverage_amount_eur: Math.min(financialFactors.total_assets_eur, 500000),
      reason: 'Protezione patrimonio immobiliare',
    });
  }
  
  // === LIFE INSURANCE ===
  if (risk_category === 'high' || risk_category === 'very_high' || healthFactors.age > 40) {
    const lifePriority = risk_category === 'very_high' ? 'critical' : 
                        risk_category === 'high' ? 'high' : 'medium';
    
    const basePremium = 800;
    const ageMultiplier = healthFactors.age / 40;
    const healthMultiplier = (100 - scores.health_score) / 50;
    
    const exclusions: string[] = [];
    if (healthFactors.smoking_status === 'current') {
      exclusions.push('Malattie correlate al fumo con copertura ridotta');
    }
    if (lifestyleFactors.extreme_sports) {
      exclusions.push('Morte durante sport estremi non coperti');
    }
    
    recommendations.push({
      type: 'life',
      priority: lifePriority,
      estimated_premium_eur: Math.round(basePremium * ageMultiplier * healthMultiplier),
      coverage_amount_eur: Math.min(financialFactors.annual_income_eur * 10, 1000000),
      reason: risk_category === 'very_high' 
        ? 'ALTAMENTE RACCOMANDATO: Profilo ad alto rischio'
        : 'Protezione finanziaria per la famiglia',
      exclusions: exclusions.length > 0 ? exclusions : undefined,
    });
  }
  
  // === HEALTH INSURANCE ===
  if (scores.health_score < 60 || healthFactors.preexisting_conditions.length > 0) {
    const healthPriority = scores.health_score < 40 ? 'critical' : 
                          scores.health_score < 60 ? 'high' : 'medium';
    
    const basePremium = 1200;
    const healthRiskMultiplier = (100 - scores.health_score) / 50;
    const conditionsMultiplier = 1 + (healthFactors.preexisting_conditions.length * 0.2);
    
    recommendations.push({
      type: 'health',
      priority: healthPriority,
      estimated_premium_eur: Math.round(basePremium * healthRiskMultiplier * conditionsMultiplier),
      coverage_amount_eur: 50000,
      reason: healthFactors.preexisting_conditions.length > 0
        ? `Condizioni preesistenti richiedono copertura sanitaria (${healthFactors.preexisting_conditions.length} condizioni)`
        : 'Basso punteggio salute richiede protezione medica',
      exclusions: healthFactors.preexisting_conditions.map(c => 
        `${c.name}: ${c.controlled ? 'coperta con franchigia' : 'periodo di attesa 12 mesi'}`
      ),
    });
  }
  
  // === TRAVEL INSURANCE ===
  if (lifestyleFactors.travel_frequency_per_year > 3) {
    const travelPriority = lifestyleFactors.high_risk_destinations.length > 0 ? 'high' : 'medium';
    
    recommendations.push({
      type: 'travel',
      priority: travelPriority,
      estimated_premium_eur: 150 + (lifestyleFactors.travel_frequency_per_year * 30),
      coverage_amount_eur: 100000,
      reason: `Viaggi frequenti (${lifestyleFactors.travel_frequency_per_year} volte/anno) richiedono copertura`,
      exclusions: lifestyleFactors.high_risk_destinations.length > 0
        ? ['Destinazioni ad alto rischio potrebbero avere limitazioni']
        : undefined,
    });
  }
  
  // === LIABILITY INSURANCE ===
  if (financialFactors.total_assets_eur > 100000 || financialFactors.employment_status === 'self_employed') {
    recommendations.push({
      type: 'liability',
      priority: financialFactors.employment_status === 'self_employed' ? 'high' : 'medium',
      estimated_premium_eur: 300,
      coverage_amount_eur: 2000000,
      reason: financialFactors.employment_status === 'self_employed'
        ? 'Protezione responsabilità civile professionale essenziale'
        : 'Protezione patrimonio da richieste di risarcimento',
    });
  }
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

// ================================================================
// MAIN ASSESSMENT FUNCTION
// ================================================================

export function performRiskAssessment(
  healthFactors: HealthFactors,
  financialFactors: FinancialFactors,
  lifestyleFactors: LifestyleFactors
): {
  scores: RiskScores;
  recommendations: ProductRecommendation[];
} {
  const health_score = calculateHealthScore(healthFactors);
  const financial_score = calculateFinancialScore(financialFactors);
  const lifestyle_score = calculateLifestyleScore(lifestyleFactors);
  
  const scores = calculateTotalRiskScore(health_score, financial_score, lifestyle_score);
  const recommendations = generateProductRecommendations(
    scores,
    healthFactors,
    financialFactors,
    lifestyleFactors
  );
  
  return { scores, recommendations };
}

// ================================================================
// EXPORT ALL
// ================================================================

export default {
  calculateHealthScore,
  calculateFinancialScore,
  calculateLifestyleScore,
  calculateTotalRiskScore,
  generateProductRecommendations,
  performRiskAssessment,
};
