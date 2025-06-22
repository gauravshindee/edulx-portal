// src/components/dashboard/TotalExpenseOverview.tsx
import Chart from "react-apexcharts";
import { Icon } from "@iconify/react";
// import { Badge } from "flowbite-react"; // Removed as it's commented out in JSX and not used
import { useNavigate } from 'react-router-dom';
import { useTotalExpenses } from 'src/hooks/useTotalExpenses';
import dayjs from 'dayjs'; // Make sure this import is present

const TotalExpenseOverview = () => {
  const navigate = useNavigate();
  const { totalAmount, expenseGrowthSeries, loading, error } = useTotalExpenses();

  // Get current date and format it
  const today = dayjs().format('MMM DD,YYYY'); // Example: Jun 19, 2025

  const handleClick = () => {
    navigate('/student/totalexpense');
  };

  const chartValues = expenseGrowthSeries.map(point => point.y);
  // Ensure we get at least 6 points for consistent chart appearance,
  // filling with 0 if less than 6 available.
  const lastSixPoints = chartValues.slice(Math.max(chartValues.length - 6, 0));
  const chartDataPoints = lastSixPoints.length > 0 ? lastSixPoints : [0, 0, 0, 0, 0, 0];

  const ChartData: any = { // Keeping any for now due to complexity, but ideal to type ApexOptions
    series: [
      {
        name: "Total Expense",
        color: "var(--color-error)", // This color is for the line
        data: chartDataPoints,
      },
    ],
    chart: {
      id: "total-expense-chart",
      type: "area",
      height: 60,
      sparkline: {
        enabled: true,
      },
      group: "sparklines",
      fontFamily: "inherit",
      foreColor: "var(--color-bodytext)", // Set a theme-aware foreColor for chart elements like tooltips
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
            enabled: true,
            delay: 150
        },
        dynamicAnimation: {
            enabled: true,
            speed: 350
        }
      }
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0.5, // Start opacity higher for better visibility
        opacityTo: 0,
        stops: [0, 100], // Corrected stops from [20, 180] to [0, 100] for percentage
        colorStops: [ // Define gradient colors more explicitly for error color
          { offset: 0, color: 'var(--color-error)', opacity: 0.5 },
          { offset: 100, color: 'var(--color-error)', opacity: 0 }
        ]
      },
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: "dark", // Use 'dark' theme for tooltips (will match dark mode)
      x: {
        show: false,
      },
      y: {
        formatter: function (val: number) {
          // 'text' is not a parameter here, it's 'val'
          return `₹${val.toLocaleString('en-IN')}`;
        },
        title: {
          // Suppress seriesName unused warning by prefixing with underscore
          formatter: (_seriesName: string) => ''
        }
      },
      // Fixed tooltip position can sometimes be problematic with sparklines
      // Removing `fixed` property for sparkline charts usually works better
      // or ensure it's positioned within bounds.
      fixed: {
        enabled: false, // Set to false for better sparkline tooltip behavior
      },
    },
    xaxis: {
      type: 'category',
      categories: expenseGrowthSeries.slice(Math.max(expenseGrowthSeries.length - 6, 0)).map(point => dayjs(point.x).format('MMM DD')),
      labels: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false, // Tooltip for xaxis labels, not the main data series tooltip
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        top: 0, // Added top and bottom padding for more control
        bottom: 0
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-darkgray rounded-xl shadow-md dark:shadow-dark-md p-8 flex items-center justify-center min-h-[150px]">
        <p className="text-gray-500 dark:text-gray-400">Loading expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-darkgray rounded-xl shadow-md dark:shadow-dark-md p-8 flex items-center justify-center min-h-[150px]">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white dark:bg-darkgray rounded-xl shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow duration-200 dark:shadow-dark-md dark:hover:shadow-dark-lg"
        onClick={handleClick}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-lighterror text-error p-3 rounded-md">
            <Icon icon="solar:wallet-money-linear" height={24} />
          </div>
          <p className="text-lg font-semibold text-dark dark:text-white">Total Study Expense</p>
        </div>
        <div className="flex">
          <div className="flex-1">
            <p className="text-xl text-dark dark:text-white font-medium mb-2">
              ₹{totalAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Till: {today}</p>
          </div>
          <div className="rounded-bars flex-1 md:ps-7">
            <Chart
              options={ChartData} // Options object
              series={ChartData.series} // Series array
              type="area"
              height="60px"
              width="100%"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TotalExpenseOverview;