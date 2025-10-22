// Main Dashboard Component
export { FinancialDashboard } from "./FinancialDashboard";

// Individual Dashboard Components
export { FinancialMetricsCards, QuickStats } from "./FinancialMetricsCards";
export { RevenueAnalytics } from "./RevenueAnalytics";
export { ExpenseAnalytics } from "./ExpenseAnalytics";
export { StudentPaymentStatus } from "./StudentPaymentStatus";
export { FinancialAlerts } from "./FinancialAlerts";
export { AccountBalances } from "./AccountBalances";

// Chart Components
export {
  ExpenseBreakdownChart,
  PaymentMethodChart,
  AccountBalancesChart,
  StudentPaymentStatusChart,
  MonthlyTrendChart,
} from "./FinancialCharts";

// Hook exports
export {
  useFinancialDashboard,
  useFinancialFormatting,
  type FinancialDashboardData,
  type UseFinancialDashboardOptions,
  type UseFinancialDashboardReturn,
} from "../../hooks/useFinancialDashboard";
