// COMMISSION REPORTS - EDGE CASES TEST SCENARIOS
// ================================================
// Test cases for CommissionReports component edge handling

export const testScenarios = [
  {
    name: "Empty Date Range",
    filters: {
      startDate: "2025-12-01", // Future dates
      endDate: "2025-12-31",
      status: "",
      commissionType: ""
    },
    expectedResults: {
      totalCommissions: 0,
      totalAmount: 0,
      averageAmount: 0,
      message: "Nessuna commissione trovata per i filtri selezionati"
    }
  },
  {
    name: "Status Annullata Filter",
    filters: {
      startDate: "2025-10-01",
      endDate: "2025-10-31", 
      status: "cancelled",
      commissionType: ""
    },
    expectedResults: {
      totalCommissions: 0,
      totalAmount: 0,
      averageAmount: 0,
      message: "Nessuna commissione trovata per i filtri selezionati"
    }
  },
  {
    name: "Bonus Type Only",
    filters: {
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      status: "",
      commissionType: "bonus"
    },
    expectedResults: {
      totalCommissions: 1,
      totalAmount: 200.00,
      averageAmount: 200.00,
      records: [
        {
          policy_number: "CASA-2025-003",
          contact_name: "Anna Gialli",
          commission_type: "bonus",
          commission_amount: 200.00,
          status: "calculated"
        }
      ]
    }
  },
  {
    name: "Paid Status Only", 
    filters: {
      startDate: "2025-10-01",
      endDate: "2025-10-31",
      status: "paid",
      commissionType: ""
    },
    expectedResults: {
      totalCommissions: 1,
      totalAmount: 60.00,
      averageAmount: 60.00,
      records: [
        {
          policy_number: "AUTO-2025-001",
          contact_name: "Mario Rossi",
          commission_type: "base",
          commission_amount: 60.00,
          status: "paid"
        }
      ]
    }
  }
];

// Expected demo data for verification
export const expectedDemoData = {
  totalRecords: 3,
  totalAmount: 372.50,
  averageAmount: 124.17,
  records: [
    {
      policy_number: "AUTO-2025-001",
      contact_name: "Mario Rossi", 
      commission_type: "base",
      commission_amount: 60.00,
      status: "paid",
      calculation_date: "2025-10-05"
    },
    {
      policy_number: "VITA-2025-002",
      contact_name: "Luigi Bianchi",
      commission_type: "renewal", 
      commission_amount: 112.50,
      status: "pending",
      calculation_date: "2025-10-12"
    },
    {
      policy_number: "CASA-2025-003",
      contact_name: "Anna Gialli",
      commission_type: "bonus",
      commission_amount: 200.00,
      status: "calculated",
      calculation_date: "2025-10-15"
    }
  ]
};