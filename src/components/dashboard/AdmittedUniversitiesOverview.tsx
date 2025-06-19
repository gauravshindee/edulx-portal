// src/components/dashboard/AdmittedUniversitiesOverview.tsx
import { Badge } from "flowbite-react";
import { Table } from "flowbite-react";
import { Icon } from "@iconify/react"; // Already imported
import SimpleBar from "simplebar-react";
import { useNavigate } from 'react-router-dom';

import { useAdmittedUniversities } from 'src/hooks/useAdmittedUniversities';

const AdmittedUniversitiesOverview = () => {
  const navigate = useNavigate();
  const { admittedUniversities, loading, error } = useAdmittedUniversities();

  const handleClick = () => {
    navigate('/student/applications');
  };

  if (loading) {
    return (
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray pt-6 px-0 relative w-full break-words flex items-center justify-center min-h-[250px]">
        <p className="text-gray-500">Loading admitted universities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray pt-6 px-0 relative w-full break-words flex items-center justify-center min-h-[250px]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray pt-6 px-0 relative w-full break-words cursor-pointer hover:shadow-lg transition-shadow duration-200"
        onClick={handleClick}
      >
        <div className="px-6 flex items-center gap-3"> {/* Added flex and gap for icon alignment */}
          <div className="bg-lightprimary text-primary p-3 rounded-md"> {/* Example style, adjust as needed */}
            <Icon icon="solar:diploma-linear" height={24} /> {/* Changed icon to a relevant one */}
          </div>
          <h5 className="card-title mb-0">Admitted Universities</h5> {/* Removed mb-6 and added mb-0 to align better */}
        </div>
        <SimpleBar className="max-h-[450px]">
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="p-6">University</Table.HeadCell>
                <Table.HeadCell>Course</Table.HeadCell>
                <Table.HeadCell>City</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y divide-border dark:divide-darkborder ">
                {admittedUniversities.length > 0 ? (
                  admittedUniversities.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell className="whitespace-nowrap ps-6">
                        <div className="flex gap-3 items-center">
                          <div className="flex-shrink-0">
                            <Icon icon="solar:university-linear" height={24} className="text-primary" />
                          </div>
                          <div className="truncat line-clamp-2 sm:text-wrap max-w-56">
                            <h6 className="text-sm">{item.university}</h6>
                      
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="me-5">
                          <p className="text-base">{item.course}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                         <p className="text-base">{item.city}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          className={
                            item.applicationStatus === "Admitted"
                              ? "bg-lightsuccess text-success"
                              : "bg-lightinfo text-info"
                          }
                        >
                          {item.applicationStatus}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan={4} className="text-center py-4">
                      No admitted universities found yet.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
        </SimpleBar>
      </div>
    </>
  );
};

export default AdmittedUniversitiesOverview;