import { Auth } from '@/components/home/auth';
import ReportsDashboard from '@/components/reports/ReportsDashboard';

export default function ReportsPage() {
  return (
    <Auth>
      <ReportsDashboard />
    </Auth>
  );
}