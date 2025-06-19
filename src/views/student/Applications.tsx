import React, { useState, useEffect } from 'react';
import { Button, Modal, Progress, Upload, message, Form, Input, Select, DatePicker } from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  FileExcelOutlined,
  SaveOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined // Added for the custom confirm icon
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import dayjs from 'dayjs';

// Firebase Imports
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from 'src/firebase'; // Adjust path as per your firebase.ts location

// Define the interface for an Application (matches your previous definition)
interface Application {
  id?: string; // Made optional as Firestore generates it
  userId: string; // To link applications to a specific user
  city: string;
  university: string;
  course: string;
  intake: string;
  universityLink: string;
  applicationDeadline: string; // Will be stored as YYYY-MM-DD string
  profileFit: 'High' | 'Medium' | 'Low';
  priority: 'High' | 'Medium' | 'Low';
  applicationStatus: 'Not Started' | 'In Progress' | 'Applied' | 'Admitted' | 'Rejected' | 'Deferred';
  result: string;
  applicationFees: number; // Stored as a number
  comments: string;
}

const { Option } = Select;

const Applications: React.FC = () => {
  const [user, setUser] = useState<User | null>(null); // State to hold the authenticated user
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true); // Loading state for fetching data

  const [isAddModalVisible, setIsAddModalVisible] = useState(false); // For Add/Edit Form Modal
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [form] = Form.useForm();

  // New state for custom delete confirmation modal
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false);
  const [appToDeleteId, setAppToDeleteId] = useState<string | null>(null);


  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Data fetching will now be triggered by the user state change in the next useEffect
      if (!currentUser) {
        setApplications([]); // Clear applications if logged out
        setLoading(false);
      }
    });
    return () => unsubscribeAuth(); // Cleanup auth listener
  }, []);

  // 2. Fetch Applications from Firestore (real-time with onSnapshot)
  useEffect(() => {
    if (!user) {
      setApplications([]); // Clear applications if no user
      setLoading(false);
      return;
    }

    setLoading(true);
    // Reference to the user's specific applications subcollection
    const applicationsCollectionRef = collection(db, `users/${user.uid}/applications`);
    const q = query(applicationsCollectionRef);

    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const applicationsData: Application[] = snapshot.docs.map((doc) => ({
          id: doc.id, // Use Firestore's generated ID
          ...doc.data(),
        })) as Application[];
        setApplications(applicationsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching applications:", error);
        message.error("Failed to fetch applications. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore(); // Cleanup Firestore listener on unmount or user change
  }, [user]); // Re-run when user changes

  // Calculate progress and pending universities
  const totalApplications = applications.length;
  const appliedApplications = applications.filter(app => app.applicationStatus === 'Applied').length;
  const progressPercentage = totalApplications > 0 ? (appliedApplications / totalApplications) * 100 : 0;
  const universitiesStillPending = totalApplications - appliedApplications;

  // 3. Handle Save/Update Application to Firestore
  const handleSaveApplication = async (values: Application) => {
    if (!user) {
      message.error("Please log in to add or update applications.");
      return;
    }

    setLoading(true);
    const applicationData = {
      ...values,
      userId: user.uid, // Ensure userId is correctly set
      applicationDeadline: values.applicationDeadline
        ? dayjs(values.applicationDeadline).format('YYYY-MM-DD')
        : '',
      applicationFees: Number(values.applicationFees) || 0, // Ensure it's a number
    };

    try {
      if (editingApplication?.id) {
        // Update existing application
        const docRef = doc(db, `users/${user.uid}/applications`, editingApplication.id);
        await updateDoc(docRef, applicationData);
        message.success('Application updated successfully!');
      } else {
        // Add new application
        await addDoc(collection(db, `users/${user.uid}/applications`), applicationData);
        message.success('Application added successfully!');
      }
      handleCancelAddEditModal();
    } catch (error) {
      console.error("Error saving application:", error);
      message.error("Failed to save application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ***********************************************
  // NEW DELETION LOGIC STARTS HERE (corrected from previous iteration)
  // ***********************************************

  // 4. Handle Delete Application - Initiates the custom confirmation modal
  const handleDeleteApplication = (id: string) => {
    console.log("handleDeleteApplication called for ID:", id);
    if (!user) {
      message.error("Please log in to delete applications.");
      return;
    }
    setAppToDeleteId(id); // Store the ID of the application to be deleted
    setIsDeleteConfirmModalVisible(true); // Show the custom confirmation modal
  };

  // Function to execute deletion after confirmation
  const confirmDelete = async () => {
    if (!user || !appToDeleteId) {
      message.error("Deletion request invalid or user not logged in.");
      setIsDeleteConfirmModalVisible(false); // Close modal if invalid state
      return;
    }

    setLoading(true);
    try {
      console.log("Attempting Firestore delete for doc path:", `users/${user.uid}/applications/${appToDeleteId}`);
      await deleteDoc(doc(db, `users/${user.uid}/applications`, appToDeleteId));
      message.success('Application deleted successfully!');
      console.log("Firestore delete successful.");

      // If the deleted item was the one in detail view, close the detail modal
      if (selectedApplication?.id === appToDeleteId) {
        setIsDetailModalVisible(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error("Error during Firestore delete operation:", error);
      message.error("Failed to delete application. Please try again.");
    } finally {
      setLoading(false);
      setAppToDeleteId(null); // Clear the ID after deletion attempt
      setIsDeleteConfirmModalVisible(false); // Close the custom confirmation modal
    }
  };

  // Function to cancel deletion from custom confirmation modal
  const cancelDelete = () => {
    setAppToDeleteId(null); // Clear the ID
    setIsDeleteConfirmModalVisible(false); // Close the custom confirmation modal
    message.info('Deletion cancelled.');
  };

  // ***********************************************
  // NEW DELETION LOGIC ENDS HERE
  // ***********************************************


  // 5. Handle File Upload (CSV/XLSX) and Save to Firestore
  const handleFileUpload = async (file: File) => {
    if (!user) {
      message.error("Please log in to upload applications.");
      return Promise.reject(false);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => { // Made async to await Firestore operations
        const data = e.target?.result;
        let parsedData: Application[] = [];

        try {
          if (file.name.endsWith('.csv')) {
            Papa.parse(data as string, {
              header: true,
              skipEmptyLines: true,
              complete: async (results) => { // Made complete callback async
                parsedData = results.data.map((row: any) => ({
                  userId: user.uid, // Assign userId for imported data
                  city: row.City || '',
                  university: row.University || '',
                  course: row.Course || '',
                  intake: row.Intake || '',
                  universityLink: row['University link'] || '',
                  applicationDeadline: row['Application deadline'] || '',
                  profileFit: (row['Profile Fit'] as 'High' | 'Medium' | 'Low') || 'Medium',
                  priority: (row.Priority as 'High' | 'Medium' | 'Low') || 'Medium',
                  applicationStatus: (row['Application Status'] as 'Not Started' | 'In Progress' | 'Applied' | 'Admitted' | 'Rejected' | 'Deferred') || 'Not Started',
                  result: row.Result || '',
                  applicationFees: Number(row['Application Fees']) || 0,
                  comments: row.Comments || '',
                }));

                // Batch add to Firestore
                let addedCount = 0;
                for (const app of parsedData) {
                  try {
                    await addDoc(collection(db, `users/${user.uid}/applications`), app);
                    addedCount++;
                  } catch (batchError) {
                    console.error("Error adding one application from CSV:", app, batchError);
                  }
                }
                message.success(`${addedCount} applications added from CSV!`);
                resolve(true);
              },
              error: (err) => {
                message.error(`CSV parsing error: ${err.message}`);
                reject(false);
              }
            });
          } else if (file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);

            parsedData = json.map((row: any) => ({
                userId: user.uid, // Assign userId for imported data
                city: row.City || '',
                university: row.University || '',
                course: row.Course || '',
                intake: row.Intake || '',
                universityLink: row['University link'] || '',
                applicationDeadline: row['Application deadline'] || '',
                profileFit: (row['Profile Fit'] as 'High' | 'Medium' | 'Low') || 'Medium',
                priority: (row.Priority as 'High' | 'Medium' | 'Low') || 'Medium',
                applicationStatus: (row['Application Status'] as 'Not Started' | 'In Progress' | 'Applied' | 'Admitted' | 'Rejected' | 'Deferred') || 'Not Started',
                result: row.Result || '',
                applicationFees: Number(row['Application Fees']) || 0,
                comments: row.Comments || '',
            }));

            // Batch add to Firestore
            let addedCount = 0;
            for (const app of parsedData) {
              try {
                await addDoc(collection(db, `users/${user.uid}/applications`), app);
                addedCount++;
              } catch (batchError) {
                console.error("Error adding one application from XLSX:", app, batchError);
              }
            }
            message.success(`${addedCount} applications added from XLSX!`);
            resolve(true);
          } else {
            message.error('Unsupported file type. Please upload a .csv or .xlsx file.');
            reject(false);
          }
        } catch (parseError) {
          console.error("Error processing uploaded file:", parseError);
          message.error('Error processing file. Please check its content.');
          reject(false);
        }
      };
      reader.onerror = (error) => {
        message.error('Error reading file.');
        reject(false);
      };
      reader.readAsBinaryString(file);
    });
  };

  const showAddModal = () => {
    setEditingApplication(null);
    form.resetFields();
    setIsAddModalVisible(true);
  };

  const handleCancelAddEditModal = () => {
    setIsAddModalVisible(false);
    setEditingApplication(null);
    form.resetFields();
  };

  const handleEdit = (app: Application) => {
    setEditingApplication(app);
    form.setFieldsValue({
      ...app,
      applicationDeadline: app.applicationDeadline ? dayjs(app.applicationDeadline) : null,
      applicationFees: Number(app.applicationFees), // Ensure it's a number for the form
    });
    setIsAddModalVisible(true);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      ["City", "University", "Course", "Intake", "University link", "Application deadline", "Profile Fit", "Priority", "Application Status", "Result", "Application Fees", "Comments"],
      ["Toronto", "University of Toronto", "M.Eng. Computer Engineering", "Fall 2025", "https://www.utoronto.ca", "2024-12-01", "High", "High", "Applied", "Pending", 120, "Strong program, competitive."],
      ["Vancouver", "University of British Columbia", "MSc Data Science", "Fall 2025", "https://www.ubc.ca", "2024-11-15", "Medium", "Medium", "In Progress", "N/A", 100, "Requires GRE scores."],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    XLSX.writeFile(wb, "applications_template.xlsx");
    message.success('Sample XLSX template downloaded!');
  };

  // State and functions for the detail modal within ApplicationCard
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleCloseDetailModal = () => {
    console.log("handleCloseDetailModal called from Applications component (main)"); // Added log
    setIsDetailModalVisible(false);
    setSelectedApplication(null); // Clear selected application
  };


  const ApplicationCard: React.FC<{ app: Application; onEdit: (app: Application) => void; onDelete: (id: string) => void }> = ({ app, onEdit, onDelete }) => {

    const getStatusColor = (status: Application['applicationStatus']) => {
      switch (status) {
        case 'Applied': return 'bg-green-500';
        case 'In Progress': return 'bg-blue-500';
        case 'Not Started': return 'bg-gray-400';
        case 'Admitted': return 'bg-purple-600';
        case 'Rejected': return 'bg-red-500';
        case 'Deferred': return 'bg-orange-500';
        default: return 'bg-gray-400';
      }
    };

    const handleDeleteClick = () => {
      // Calls the parent's handleDeleteApplication, which now shows the custom modal
      onDelete(app.id!); // Assuming id is always present when deleting
    };

    return (
      <div
        className="bg-white dark:bg-darkgray rounded-xl shadow-md p-5 mb-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        onClick={(e) => {
            // Only open detail modal if click is not on a button or link inside the card
            if (!(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLAnchorElement)) {
                setSelectedApplication(app); // Set the selected application in parent state
                setIsDetailModalVisible(true); // Open the parent's detail modal
            }
        }}
      >
        <h5 className="text-lg font-semibold text-primary-dark dark:text-white truncate mb-1">
          {app.university}
        </h5>
        <p className="text-bodytext text-sm mb-1 truncate">{app.course}</p>
        <p className="text-xs text-gray-500 mb-2 truncate">{app.city}</p>

        <div className="flex justify-between items-center text-sm font-medium mt-3">
          <span className="text-bodytext">Deadline: {app.applicationDeadline || 'N/A'}</span>
          <span className={`px-3 py-1 rounded-full text-white text-xs ${getStatusColor(app.applicationStatus)}`}>
            {app.applicationStatus}
          </span>
        </div>

        {/* Action buttons at the bottom of the card */}
        <div className="flex justify-end mt-4 space-x-2">
            <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onEdit(app);
                }}
                className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
            >
                Edit
            </Button>
            <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleDeleteClick(); // Triggers the custom confirmation modal
                }}
            >
                Delete
            </Button>
        </div>
      </div>
    );
  };


  // If not logged in, display a message
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4 text-dark dark:text-white">Application Tracking</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Please log in to view and manage your university applications.
        </p>
      </div>
    );
  }

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4 text-dark dark:text-white">Application Tracking</h2>
        {/* Changed width to size as per Ant Design deprecation warning */}
        <Progress type="circle" percent={100} size={80} status="active" />
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-4 bg-white dark:bg-darkgray rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-dark dark:text-white mb-4">
          Application Tracking Overview
        </h2>
        <div className="flex items-center mb-2">
          <div className="relative flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                width: `${progressPercentage}%`,
                background: 'linear-gradient(to right, #4A5568, #FBCC32)',
              }}
            ></div>
          </div>
          <span className="ml-4 text-base font-semibold text-dark dark:text-white">
            {appliedApplications}/{totalApplications} applied ({Math.round(progressPercentage)}%)
          </span>
        </div>
        <p className="text-sm text-bodytext dark:text-gray-400">
          ({universitiesStillPending} Universities Still Pending)
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddModal}
          className="bg-primary text-white hover:bg-yellow-500 transition-colors"
          style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
        >
          Add University
        </Button>

        <Upload
          name="file"
          accept=".csv,.xlsx"
          beforeUpload={handleFileUpload} // Handles upload and saving to Firestore
          showUploadList={false}
          maxCount={1} // Allow only one file at a time
        >
          <Button icon={<UploadOutlined />} className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
            Upload Applications (CSV/XLSX)
          </Button>
        </Upload>

        <Button
          icon={<FileExcelOutlined />}
          onClick={handleDownloadSampleTemplate}
          className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Download Sample Template
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {applications.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-darkgray rounded-xl shadow-md p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-lg text-bodytext dark:text-gray-300 font-medium mb-4">
              The Edulx Application Team will soon add universities tailored to your course and profile directly to your dashboard.
            </p>
            <p className="text-md text-gray-500 dark:text-gray-400">
              You can also manually add universities using the "Add University" button above, or upload a list via CSV/XLSX.
            </p>
          </div>
        ) : (
          applications.map(app => (
            <ApplicationCard
                key={app.id}
                app={app}
                onEdit={handleEdit}
                onDelete={handleDeleteApplication} // This now triggers the custom modal
            />
          ))
        )}
      </div>

      {/* Add/Edit Application Modal */}
      <Modal
        title={
          <span className="text-dark dark:text-white">
            {editingApplication ? "Edit Application" : "Add New University Application"}
          </span>
        }
        open={isAddModalVisible}
        onCancel={handleCancelAddEditModal}
        footer={null}
        width={700}
        centered
        className="application-form-modal"
        destroyOnHidden={true} // Applied the deprecation fix
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveApplication}
          initialValues={editingApplication ? {
            ...editingApplication,
            applicationDeadline: editingApplication.applicationDeadline ? dayjs(editingApplication.applicationDeadline) : null,
          } : {
            city: '',
            university: '',
            course: '',
            intake: '',
            universityLink: '',
            applicationDeadline: null,
            profileFit: 'Medium',
            priority: 'Medium',
            applicationStatus: 'Not Started',
            result: '',
            applicationFees: 0,
            comments: '',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="city" label="City" rules={[{ required: true, message: 'Please input the city!' }]}>
              <Input className="form-control-input" placeholder="e.g., Toronto" />
            </Form.Item>
            <Form.Item name="university" label="University" rules={[{ required: true, message: 'Please input the university name!' }]}>
              <Input className="form-control-input" placeholder="e.g., University of Toronto" />
            </Form.Item>
            <Form.Item name="course" label="Course" rules={[{ required: true, message: 'Please input the course name!' }]}>
              <Input className="form-control-input" placeholder="e.g., M.Eng. Computer Engineering" />
            </Form.Item>
            <Form.Item name="intake" label="Intake" rules={[{ required: true, message: 'Please select the intake!' }]}>
              <Select className="select-md" placeholder="Select Intake">
                <Option value="Fall 2024">Fall 2024</Option>
                <Option value="Winter 2025">Winter 2025</Option>
                <Option value="Spring 2025">Spring 2025</Option>
                <Option value="Summer 2025">Summer 2025</Option>
                <Option value="Fall 2025">Fall 2025</Option>
                <Option value="Winter 2026">Winter 2026</Option>
                <Option value="Spring 2026">Spring 2026</Option>
                <Option value="Summer 2026">Summer 2026</Option>
              </Select>
            </Form.Item>
            <Form.Item name="universityLink" label="University Link" rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}>
              <Input className="form-control-input" placeholder="e.g., https://www.utoronto.ca" />
            </Form.Item>
            <Form.Item name="applicationDeadline" label="Application Deadline">
              <DatePicker className="form-control-input" style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="profileFit" label="Profile Fit" rules={[{ required: true, message: 'Please select profile fit!' }]}>
              <Select className="select-md" placeholder="Select Profile Fit">
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority" rules={[{ required: true, message: 'Please select priority!' }]}>
              <Select className="select-md" placeholder="Select Priority">
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
              </Select>
            </Form.Item>
            <Form.Item name="applicationStatus" label="Application Status" rules={[{ required: true, message: 'Please select application status!' }]}>
              <Select className="select-md" placeholder="Select Status">
                <Option value="Not Started">Not Started</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Applied">Applied</Option>
                <Option value="Admitted">Admitted</Option>
                <Option value="Rejected">Rejected</Option>
                <Option value="Deferred">Deferred</Option>
              </Select>
            </Form.Item>
            <Form.Item name="result" label="Result">
              <Input className="form-control-input" placeholder="e.g., Pending, Admitted, Rejected" />
            </Form.Item>
            <Form.Item name="applicationFees" label="Application Fees" rules={[{ type: 'number', message: 'Please enter a valid number!', transform: value => Number(value) || 0 }]}>
              <Input type="number" className="form-control-input" placeholder="e.g., 100" />
            </Form.Item>
            <Form.Item name="comments" label="Comments" className="md:col-span-2">
              <Input.TextArea className="form-control-textarea" rows={3} placeholder="Any additional comments..." />
            </Form.Item>
          </div>
          <Form.Item className="mt-4 flex justify-end">
            <Button onClick={handleCancelAddEditModal} className="mr-2 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              className="bg-primary text-white hover:bg-yellow-500 transition-colors"
              style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
            >
              {editingApplication ? "Update Application" : "Add Application"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Application Details Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="text-dark dark:text-white">
              {selectedApplication ? `${selectedApplication.university} - Application Details` : "Application Details"}
            </span>
          </div>
        }
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal} // This handles the 'X' button and clicking outside
        footer={[
          <Button
            key="delete"
            onClick={() => {
              if (selectedApplication?.id) {
                handleDeleteApplication(selectedApplication.id); // Trigger custom delete modal
                handleCloseDetailModal(); // Close the detail modal
              }
            }}
            icon={<DeleteOutlined />}
            danger
            className="mr-2"
          >
            Delete
          </Button>,
          <Button
            key="edit"
            onClick={() => {
              if (selectedApplication) {
                handleEdit(selectedApplication); // Open edit modal
                handleCloseDetailModal(); // Close detail modal
              }
            }}
            className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600 mr-2"
          >
            Edit
          </Button>,
          <Button
            key="close"
            onClick={handleCloseDetailModal}
            type="primary"
            style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
          >
            Close
          </Button>,
        ]}
        width={700}
        centered
        className="application-detail-modal"
        destroyOnHidden={true} // Applied the deprecation fix
      >
        {selectedApplication && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-bodytext dark:text-gray-200 text-base mt-4">
            <div><strong>City:</strong> {selectedApplication.city}</div>
            <div><strong>University:</strong> {selectedApplication.university}</div>
            <div><strong>Course:</strong> {selectedApplication.course}</div>
            <div><strong>Intake:</strong> {selectedApplication.intake}</div>
            <div className="md:col-span-2">
              <strong>University Link:</strong>{' '}
              <a href={selectedApplication.universityLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                {selectedApplication.universityLink}
              </a>
            </div>
            <div><strong>Application Deadline:</strong> {selectedApplication.applicationDeadline || 'N/A'}</div>
            <div><strong>Profile Fit:</strong> {selectedApplication.profileFit}</div>
            <div><strong>Priority:</strong> {selectedApplication.priority}</div>
            <div><strong>Application Status:</strong> {selectedApplication.applicationStatus}</div>
            <div><strong>Result:</strong> {selectedApplication.result || 'N/A'}</div>
            <div><strong>Application Fees:</strong> ${selectedApplication.applicationFees}</div>
            <div className="md:col-span-2">
              <strong>Comments:</strong> {selectedApplication.comments || 'N/A'}
            </div>
          </div>
        )}
      </Modal>

      {/* NEW: Custom Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center text-dark dark:text-white">
            <ExclamationCircleOutlined className="text-red-500 mr-2 text-xl" />
            Confirm Deletion
          </div>
        }
        open={isDeleteConfirmModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="back" onClick={cancelDelete} className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
            No, Keep It
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger // Make the button red
            onClick={confirmDelete}
            icon={<DeleteOutlined />}
          >
            Yes, Delete
          </Button>,
        ]}
        centered
        destroyOnHidden={true} // Ensure the modal content is destroyed
      >
        <p className="text-bodytext dark:text-gray-300 text-base py-4">
          Are you absolutely sure you want to delete this application? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Applications;