// src/components/dashboard/TotalExpenseOverview.tsx
import Chart from "react-apexcharts";
import { Icon } from "@iconify/react";
import { Badge } from "flowbite-react"; // Keep Badge if you use it elsewhere, otherwise it can be removed
import { useNavigate } from 'react-router-dom';
import { useTotalExpenses } from 'src/hooks/useTotalExpenses';
import dayjs from 'dayjs'; // Make sure this import is present

const TotalExpenseOverview = () => {
  const navigate = useNavigate();
  const { totalAmount, expenseGrowthSeries, loading, error } = useTotalExpenses();

  // Get current date and format it
  const today = dayjs().format('MMM DD, YYYY'); // Example: Jun 19, 2025

  const handleClick = () => {
    navigate('/student/totalexpense');
  };

  const chartValues = expenseGrowthSeries.map(point => point.y);
  const lastSixPoints = chartValues.slice(Math.max(chartValues.length - 6, 0));

  const ChartData: any = {
    series: [
      {
        name: "Total Expense",
        color: "var(--color-error)",
        data: lastSixPoints.length > 0 ? lastSixPoints : [0, 0, 0, 0, 0, 0],
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
      foreColor: "#adb0bb",
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
        opacityFrom: 0,
        opacityTo: 0,
        stops: [20, 180],
      },
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: "dark",
      fixed: {
        enabled: true,
        position: "right",
      },
      x: {
        show: false,
      },
      y: {
        formatter: function (val: number) {
          return `₹${val.toLocaleString('en-IN')}`;
        }
      }
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
        enabled: false,
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
        right: 0
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 flex items-center justify-center min-h-[150px]">
        <p className="text-gray-500">Loading expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 flex items-center justify-center min-h-[150px]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // You no longer need percentageChange or badgeColor/badgeText if you're replacing it.
  // Kept for reference in case you want to revert or use elsewhere.
  // let percentageChange = 0;
  // if (expenseGrowthSeries.length > 1) {
  //   const firstVal = expenseGrowthSeries[0].y;
  //   const lastVal = expenseGrowthSeries[expenseGrowthSeries.length - 1].y;
  //   if (firstVal > 0) {
  //     percentageChange = ((lastVal - firstVal) / firstVal) * 100;
  //   } else if (lastVal > 0) {
  //     percentageChange = 100;
  //   }
  // }
  // const badgeColor = percentageChange >= 0 ? "failure" : "success";
  // const badgeText = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(0)}%`;


  return (
    <>
      <div
        className="bg-white rounded-xl shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow duration-200"
        onClick={handleClick}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-lighterror text-error p-3 rounded-md">
            <Icon icon="solar:wallet-money-linear" height={24} />
          </div>
          <p className="text-lg font-semibold text-dark">Total Study  Expense</p>
        </div>
        <div className="flex">
          <div className="flex-1">
            <p className="text-xl text-dark font-medium mb-2">
              ₹{totalAmount.toLocaleString('en-IN')}
            </p>
            {/* Replaced Badge with simple text */}
            <p className="text-sm text-gray-500">Till: {today}</p>
            {/* If you prefer just "Till Today" without the date, use this: */}
            {/* <p className="text-sm text-gray-500">Till Today</p> */}
            {/* Original Badge (commented out) */}
            {/* <Badge className={`bg-light${badgeColor} text-${badgeColor}`}>
              {badgeText}
            </Badge> */}
          </div>
          <div className="rounded-bars flex-1 md:ps-7">
            <Chart
              options={ChartData}
              series={ChartData.series}
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