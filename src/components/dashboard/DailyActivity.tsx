// src/components/dashboard/DailyActivity.tsx
// import { Link } from "react-router-dom"; // Removed as it's not used
import { Icon } from "@iconify/react"; // For the title icon
import dayjs from "dayjs"; // For formatting timestamps
import { useLoginActivity } from "src/hooks/useLoginActivity"; // Import the new custom hook

const DailyActivity = () => {
  // Destructure the values from our custom hook
  const { loginActivities, loading, error } = useLoginActivity();

  // --- Loading State ---
  if (loading) {
    return (
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words flex items-center justify-center min-h-[250px]">
        <p className="text-gray-500">Loading daily activities...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words flex items-center justify-center min-h-[250px]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // --- Render Daily Activities ---
  return (
    <>
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
        {/* Title with Icon, consistent with other dashboard cards */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-lightinfo text-info p-3 rounded-md"> {/* Adjust background and text color as desired */}
            <Icon icon="solar:history-linear" height={24} /> {/* An icon relevant to activity/history */}
          </div>
          <h5 className="card-title mb-0 text-dark dark:text-white">Daily Activities</h5> {/* No margin-bottom here to align with icon */}
        </div>

        <div className="flex flex-col mt-2">
          <ul>
            {/* Conditional rendering based on whether loginActivities array has data */}
            {loginActivities.length > 0 ? (
              loginActivities.map((item, index) => {
                // Ensure timestamp exists and is a valid Firestore Timestamp before converting
                // Firestore Timestamp has a .toDate() method
                const date = item.timestamp?.toDate();

                // Format the time and full date using dayjs
                const time = date ? dayjs(date).format("HH:mm") : "N/A";
                const fullDate = date ? dayjs(date).format("MMM DD, YYYY") : "N/A"; // e.g., "Jun 19, 2025"

                // Customize the activity description
                const activityDescription = `Logged in on ${fullDate}`;

                return (
                  // Using item.id as key is preferred for performance and stability
                  // Fallback to index if item.id is not available or unique
                  <li key={item.id || `activity-${index}`}>
                    <div className="flex gap-4 min-h-16">
                      <div className="">
                        <p className="text-gray-600 dark:text-gray-400">{time}</p> {/* Style time */}
                      </div>
                      <div className="flex flex-col items-center">
                        {/* Consistent styling for the activity dot */}
                        <div className={`rounded-full bg-primary p-1.5 w-fit`}></div>
                        {/* Render the vertical line only if it's not the last item in the list */}
                        {index < loginActivities.length - 1 && (
                          <div className={`h-full w-px bg-border dark:bg-gray-600`}></div>
                        )}
                      </div>
                      <div className="">
                        <p className="text-dark dark:text-white text-start">{activityDescription}</p>
                        {/* Removed item.id and Link as they are not relevant for simple login activities */}
                      </div>
                    </div>
                  </li>
                );
              })
            ) : (
              // Message displayed when there are no login activities
              <li>
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No login activities found yet. Log in to see your history!
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default DailyActivity;