// src/components/dashboard/NewCustomers.tsx
import { Icon } from "@iconify/react";
import { Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useProfileCompletion } from 'src/hooks/useProfileCompletion';

const NewCustomers = () => {
  const navigate = useNavigate();
  // Ensure loading and error are used, or removed if not needed.
  // We will add loading and error states to the JSX for better UX.
  const { percent, filledFields, totalFields, loading, error } = useProfileCompletion();

  const handleClick = () => {
    navigate('/student/my-profile'); // Correct path relative to the basename
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 dark:text-gray-400">Loading profile completion data...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words flex items-center justify-center min-h-[200px]">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // --- Render Profile Completion ---
  return (
    <div
      className="bg-white dark:bg-darkgray rounded-xl shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow duration-200 dark:shadow-dark-md dark:hover:shadow-dark-lg"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-lightsecondary text-secondary p-3 rounded-md">
          <Icon icon="solar:user-circle-bold" height={24} />
        </div>
        <p className="text-lg text-dark dark:text-white font-semibold">Profile Completion</p>
      </div>
      <Progress
        percent={percent}
        status={percent === 100 ? 'success' : 'active'}
        format={(currentPercent) => `${filledFields}/${totalFields} fields completed (${currentPercent?.toFixed(0)}%)`}
        strokeColor={{
          from: '#374151', // Darker color for the start of the gradient
          to: '#FBCC32',  // Yellow for the end of the gradient
        }}
        // Add styles for the text inside the progress bar for dark mode if needed
        // The `format` prop renders custom content, so its styles might need to be applied within the formatter function itself
        className="mb-3 ant-progress-text-dark-mode" // Custom class for potential CSS overrides
      />
      <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
        {totalFields - filledFields} Fields Still Missing
      </p>
    </div>
  );
};

export default NewCustomers;