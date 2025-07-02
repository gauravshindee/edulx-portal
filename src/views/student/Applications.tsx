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
import Papa from 'papaparse'; // PapaParse is correctly imported, just needs types
import dayjs from 'dayjs';

// Firebase Imports
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot } from 'firebase/firestore'; // Removed getDocs, where
import { onAuthStateChanged, User } from "firebase/auth";
import { db, auth } from "src/firebase"; // Adjust path as per your firebase.ts location

// Type definitions for PapaParse results (if @types/papaparse is installed)
import type { ParseResult, ParseError } from 'papaparse';
import type { RcFile } from 'antd/lib/upload/interface'; // For precise typing of Upload's beforeUpload

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

  // State and functions for the detail modal within ApplicationCard
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);


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
          // Ensure all fields are present or defaulted if not coming from Firestore
          // This is a common pattern to avoid `undefined` for optional fields if the document doesn't have them
          city: doc.data().city || '',
          university: doc.data().university || '',
          course: doc.data().course || '',
          intake: doc.data().intake || '',
          universityLink: doc.data().universityLink || '',
          applicationDeadline: doc.data().applicationDeadline || '',
          profileFit: doc.data().profileFit || 'Medium',
          priority: doc.data().priority || 'Medium',
          applicationStatus: doc.data().applicationStatus || 'Not Started',
          result: doc.data().result || '',
          applicationFees: Number(doc.data().applicationFees) || 0,
          comments: doc.data().comments || '',
          userId: doc.data().userId || user.uid, // Default to current user's UID
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
      // Convert dayjs object back to YYYY-MM-DD string
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
// Explicitly type the parameters and return type for beforeUpload
const handleFileUpload = async (file: RcFile, _fileList: RcFile[]): Promise<boolean> => { // Changed return type to Promise<boolean>
  if (!user) {
    message.error("Please log in to upload applications.");
    return false; // Return false to prevent upload
  }

  // Basic validation (optional, but good practice)
  const isCsvOrXlsx = file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
  if (!isCsvOrXlsx) {
    message.error('You can only upload CSV or XLSX file!');
    return false; // Stop upload
  }
  const isLt2M = file.size / 1024 / 1024 < 2; // Example: Max 2MB file size
  if (!isLt2M) {
    message.error('File must be smaller than 2MB!');
    return false; // Stop upload
  }

  return new Promise<boolean>((resolve) => { // Promise resolves to boolean
    const reader = new FileReader();
    reader.onload = async (e) => { // Made async to await Firestore operations
      const data = e.target?.result;
      let parsedData: Application[] = [];

      try {
        if (file.name.endsWith('.csv')) {
          // @ts-ignore - Ignore if @types/papaparse is not installed
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: ParseResult<any>) => { // Explicitly type results
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
              resolve(true); // Resolve with true for successful upload
            },
            error: (err: ParseError) => { // Explicitly type err
              message.error(`CSV parsing error: ${err.message}`);
              resolve(false); // Resolve with false for failed upload
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
          resolve(true); // Resolve with true for successful upload
        } else {
          message.error('Unsupported file type. Please upload a .csv or .xlsx file.');
          resolve(false); // Resolve with false for unsupported file type
        }
      } catch (parseError) {
        console.error("Error processing uploaded file:", parseError);
        message.error('Error processing file. Please check its content.');
        resolve(false); // Resolve with false for other parsing errors
      }
    };
    reader.onerror = (_error: ProgressEvent<FileReader>) => { // Used _error to suppress unused variable warning
      message.error('Error reading file.');
      resolve(false); // Resolve with false for file reading errors
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
        <p className="text-bodytext dark:text-gray-300 text-sm mb-1 truncate">{app.course}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{app.city}</p>

        <div className="flex justify-between items-center text-sm font-medium mt-3">
          <span className="text-bodytext dark:text-gray-300">Deadline: {app.applicationDeadline || 'N/A'}</span>
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
        <Progress type="circle" percent={100} size={80} status="active" className="dark:!text-white" /> {/* Added dark mode for text color if applicable */}
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
                background: 'linear-gradient(to right, var(--color-primary), var(--color-warning))', // Using CSS variables
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
          className="bg-primary text-white hover:bg-yellow-500 transition-colors dark:text-dark dark:bg-yellow-500 dark:hover:bg-yellow-600"
          style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} // Using CSS variables
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
        open={isAddModalVisible} // Use 'open' instead of 'visible'
        onCancel={handleCancelAddEditModal}
        footer={null}
        width={700}
        centered
        className="application-form-modal dark:bg-darkgray dark:text-white"
        destroyOnClose={true} // Use 'destroyOnClose'
        styles={{
          content: { backgroundColor: 'var(--color-darkgray)' }, // For Antd Modal content background
          header: { backgroundColor: 'var(--color-darkgray)', borderBottom: '1px solid var(--color-gray-700)' },
          body: { backgroundColor: 'var(--color-darkgray)' },
        }}
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
            <Form.Item name="city" label={<span className="dark:text-white">City</span>} rules={[{ required: true, message: 'Please input the city!' }]}>
              <Input className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="e.g., Toronto" />
            </Form.Item>
            <Form.Item name="university" label={<span className="dark:text-white">University</span>} rules={[{ required: true, message: 'Please input the university name!' }]}>
              <Input className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="e.g., University of Toronto" />
            </Form.Item>
            <Form.Item name="course" label={<span className="dark:text-white">Course</span>} rules={[{ required: true, message: 'Please input the course name!' }]}>
              <Input className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="e.g., M.Eng. Computer Engineering" />
            </Form.Item>
            <Form.Item name="intake" label={<span className="dark:text-white">Intake</span>} rules={[{ required: true, message: 'Please select the intake!' }]}>
              <Select className="select-md dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="Select Intake"
                 dropdownStyle={{ backgroundColor: 'var(--color-darkgraylight)' }} // Dropdown background
                 optionFilterProp="children"
                 optionLabelProp="children" // Ensure children are used for rendering
                >
                <Option value="Fall 2024" className="dark:text-white">Fall 2024</Option>
                <Option value="Winter 2025" className="dark:text-white">Winter 2025</Option>
                <Option value="Spring 2025" className="dark:text-white">Spring 2025</Option>
                <Option value="Summer 2025" className="dark:text-white">Summer 2025</Option>
                <Option value="Fall 2025" className="dark:text-white">Fall 2025</Option>
                <Option value="Winter 2026" className="dark:text-white">Winter 2026</Option>
                <Option value="Spring 2026" className="dark:text-white">Spring 2026</Option>
                <Option value="Summer 2026" className="dark:text-white">Summer 2026</Option>
              </Select>
            </Form.Item>
            <Form.Item name="universityLink" label={<span className="dark:text-white">University Link</span>} rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}>
              <Input className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="e.g., https://www.utoronto.ca" />
            </Form.Item>
            <Form.Item name="applicationDeadline" label={<span className="dark:text-white">Application Deadline</span>}>
              <DatePicker className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" style={{ width: '100%' }} format="YYYY-MM-DD"
                popupClassName="dark-picker-popup" // Custom class for dropdown
                />
            </Form.Item>
            <Form.Item name="profileFit" label={<span className="dark:text-white">Profile Fit</span>} rules={[{ required: true, message: 'Please select profile fit!' }]}>
              <Select className="select-md dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="Select Profile Fit"
                 dropdownStyle={{ backgroundColor: 'var(--color-darkgraylight)' }}
                 optionFilterProp="children"
                 optionLabelProp="children"
              >
                <Option value="High" className="dark:text-white">High</Option>
                <Option value="Medium" className="dark:text-white">Medium</Option>
                <Option value="Low" className="dark:text-white">Low</Option>
              </Select>
            </Form.Item>
            <Form.Item name="priority" label={<span className="dark:text-white">Priority</span>} rules={[{ required: true, message: 'Please select priority!' }]}>
              <Select className="select-md dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="Select Priority"
                 dropdownStyle={{ backgroundColor: 'var(--color-darkgraylight)' }}
                 optionFilterProp="children"
                 optionLabelProp="children"
              >
                <Option value="High" className="dark:text-white">High</Option>
                <Option value="Medium" className="dark:text-white">Medium</Option>
                <Option value="Low" className="dark:text-white">Low</Option>
              </Select>
            </Form.Item>
            <Form.Item name="applicationStatus" label={<span className="dark:text-white">Application Status</span>} rules={[{ required: true, message: 'Please select application status!' }]}>
              <Select className="select-md dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="Select Status"
                 dropdownStyle={{ backgroundColor: 'var(--color-darkgraylight)' }}
                 optionFilterProp="children"
                 optionLabelProp="children"
              >
                <Option value="Not Started" className="dark:text-white">Not Started</Option>
                <Option value="In Progress" className="dark:text-white">In Progress</Option>
                <Option value="Applied" className="dark:text-white">Applied</Option>
                <Option value="Admitted" className="dark:text-white">Admitted</Option>
                <Option value="Rejected" className="dark:text-white">Rejected</Option>
                <Option value="Deferred" className="dark:text-white">Deferred</Option>
              </Select>
            </Form.Item>
            <Form.Item name="result" label={<span className="dark:text-white">Result</span>}>
              <Input className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="e.g., Pending, Admitted, Rejected" />
            </Form.Item>
            <Form.Item name="applicationFees" label={<span className="dark:text-white">Application Fees</span>} rules={[{ type: 'number', message: 'Please enter a valid number!', transform: value => Number(value) || 0 }]}>
              <Input type="number" className="form-control-input dark:bg-darkgraylight dark:text-white dark:border-gray-700" placeholder="e.g., 100" />
            </Form.Item>
            <Form.Item name="comments" label={<span className="dark:text-white">Comments</span>} className="md:col-span-2">
              <Input.TextArea className="form-control-textarea dark:bg-darkgraylight dark:text-white dark:border-gray-700" rows={3} placeholder="Any additional comments..." />
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
              className="bg-primary text-white hover:bg-yellow-500 transition-colors dark:text-dark dark:bg-yellow-500 dark:hover:bg-yellow-600"
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              <span className="dark:text-dark">{editingApplication ? "Update" : "Add"} Application</span>
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail View Modal (when a card is clicked) */}
      <Modal
        title={
          <span className="text-dark dark:text-white">
            Application Details: {selectedApplication?.university}
          </span>
        }
        open={isDetailModalVisible}
        onCancel={handleCloseDetailModal}
        footer={null}
        width={700}
        centered
        className="application-detail-modal dark:bg-darkgray dark:text-white"
        styles={{
          content: { backgroundColor: 'var(--color-darkgray)' },
          header: { backgroundColor: 'var(--color-darkgray)', borderBottom: '1px solid var(--color-gray-700)' },
          body: { backgroundColor: 'var(--color-darkgray)' },
        }}
      >
        {selectedApplication && (
          <div className="space-y-3 text-bodytext dark:text-gray-300">
            <p><strong>City:</strong> {selectedApplication.city}</p>
            <p><strong>Course:</strong> {selectedApplication.course}</p>
            <p><strong>Intake:</strong> {selectedApplication.intake}</p>
            {selectedApplication.universityLink && (
              <p>
                <strong>University Link:</strong>{" "}
                <a
                  href={selectedApplication.universityLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {selectedApplication.universityLink}
                </a>
              </p>
            )}
            <p><strong>Application Deadline:</strong> {selectedApplication.applicationDeadline || 'N/A'}</p>
            <p><strong>Profile Fit:</strong> {selectedApplication.profileFit}</p>
            <p><strong>Priority:</strong> {selectedApplication.priority}</p>
            <p><strong>Application Status:</strong> {selectedApplication.applicationStatus}</p>
            <p><strong>Result:</strong> {selectedApplication.result || 'N/A'}</p>
            <p><strong>Application Fees:</strong> {selectedApplication.applicationFees || 0}</p>
            <p><strong>Comments:</strong> {selectedApplication.comments || 'N/A'}</p>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  handleEdit(selectedApplication);
                  handleCloseDetailModal(); // Close detail modal when opening edit modal
                }}
                className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Edit
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => {
                  handleDeleteApplication(selectedApplication.id!);
                  handleCloseDetailModal(); // Close detail modal when opening delete confirmation
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        title={
          <span className="text-dark dark:text-white flex items-center">
            <ExclamationCircleOutlined className="mr-2 text-warning" /> Confirm Deletion
          </span>
        }
        open={isDeleteConfirmModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
        className="dark:bg-darkgray dark:text-white"
        styles={{
          content: { backgroundColor: 'var(--color-darkgray)' },
          header: { backgroundColor: 'var(--color-darkgray)', borderBottom: '1px solid var(--color-gray-700)' },
          body: { backgroundColor: 'var(--color-darkgray)' },
        }}
      >
        <p className="text-bodytext dark:text-gray-300">
          Are you sure you want to delete this application? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Applications;