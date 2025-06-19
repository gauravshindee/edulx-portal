// src/views/dashboards/Dashboard.tsx
import { Link } from 'react-router';
import BlogCards from 'src/components/dashboard/BlogCards';
import DailyActivity from 'src/components/dashboard/DailyActivity';
import NewCustomers from 'src/components/dashboard/NewCustomers';
// import ProductRevenue from 'src/components/dashboard/ProductRevenue'; // This line was already commented.
// import { RevenueForecast } from 'src/components/dashboard/RevenueForecast'; // <--- REMOVE OR COMMENT OUT THIS LINE
import TotalExpenseOverview from 'src/components/dashboard/TotalExpenseOverview';
// NEW: Import the renamed AdmittedUniversitiesOverview component
import AdmittedUniversitiesOverview from 'src/components/dashboard/AdmittedUniversitiesOverview';

// NEW: Import the AdmissionSequences component
import AdmissionSequences from 'src/components/dashboard/AdmissionSequences'; // <--- ADD OR ENSURE THIS LINE IS PRESENT


const Dashboard = () => {
  return (
    <div className="grid grid-cols-12 gap-30">
      {/* <div className="lg:col-span-8 col-span-12">
        <RevenueForecast /> // <--- REMOVE THIS COMPONENT
      </div> */}

      {/* NEW: Place AdmissionSequences component here instead of RevenueForecast */}
      <div className="lg:col-span-8 col-span-12"> {/* This takes the same large span as RevenueForecast */}
        <AdmissionSequences />
      </div>

      <div className="lg:col-span-4 col-span-12">
        <div className="grid grid-cols-12 h-full items-stretch">
          <div className="col-span-12 mb-30">
            <NewCustomers />
          </div>
          <div className="col-span-12">
            <TotalExpenseOverview />
          </div>
        </div>
      </div>
      {/* NEW: Replace ProductRevenue with AdmittedUniversitiesOverview */}
      <div className="lg:col-span-8 col-span-12">
        <AdmittedUniversitiesOverview />
      </div>
      <div className="lg:col-span-4 col-span-12 flex">
        <DailyActivity />
      </div>
      <div className="col-span-12">
        <BlogCards />
      </div>
      <div className="flex justify-center align-middle gap-2 flex-wrap col-span-12 text-center">
        <p className="text-base">
          Design and Developed by{' '}
          <Link
            to="https://www.edulx.in"
            target="_blank"
            className="pl-1 text-primary underline decoration-primary"
          >
            Edulx.in
          </Link>
        </p>
        <p className="text-base">
          Distributed by
          <Link
            to="https://www.osoverseas.in/"
            target="_blank"
            className="pl-1 text-primary underline decoration-primary"
          >
            Os Overseas
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Dashboard;