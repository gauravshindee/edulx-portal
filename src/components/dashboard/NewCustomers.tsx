// src/components/dashboard/NewCustomers.tsx
import { Icon } from "@iconify/react";
import { Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useProfileCompletion } from 'src/hooks/useProfileCompletion';

const NewCustomers = () => {
  const navigate = useNavigate();
  const { percent, filledFields, totalFields, loading, error } = useProfileCompletion();

  const handleClick = () => {
    // CHANGE THIS LINE: Remove '/portal' from the path
    navigate('/student/my-profile'); // Correct path relative to the basename
  };

  // ... rest of your component (loading, error states, return JSX)
  // (No changes needed in the JSX, only in the handleClick function)

  return (
    <div
      className="bg-white rounded-xl shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-lightsecondary text-secondary p-3 rounded-md">
          <Icon icon="solar:user-circle-bold" height={24} />
        </div>
        <p className="text-lg text-dark font-semibold">Profile Completion</p>
      </div>
      <Progress
        percent={percent}
        status={percent === 100 ? 'success' : 'active'}
        format={(currentPercent) => `${filledFields}/${totalFields} fields completed (${currentPercent?.toFixed(0)}%)`}
        strokeColor={{
          from: '#374151',
          to: '#FBCC32',
        }}
        className="mb-3"
      />
      <p className="text-sm text-gray-500 mt-1">
        {totalFields - filledFields} Fields Still Missing
      </p>
    </div>
  );
};

export default NewCustomers;