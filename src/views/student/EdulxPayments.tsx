import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Select, Upload, message, Card, Typography, Spin, Popconfirm, Row, Col, Table } from 'antd';
import { UploadOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDownloadURL, ref as storageRef, uploadBytes, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, query, onSnapshot, Timestamp, deleteDoc } from 'firebase/firestore';
import { db, storage, auth } from 'src/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import dayjs from 'dayjs';

// Import your UPI QR Code image
import UPI_QR_CODE from 'src/assets/images/payments/UPI.jpeg';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Define interfaces
interface EduLXPackage {
  name: 'Starter' | 'Pro' | 'Premium';
  price: number;
  installments?: number;
  description: string;
  features: string[]; // Key features to display
}

interface PaymentRecord {
  id?: string; // Firestore document ID
  userId: string;
  packageName: 'Starter' | 'Pro' | 'Premium';
  packagePrice: number;
  amountPaid: number;
  paymentMethod: string; // e.g., "Bank Transfer", "UPI"
  bankDetailsUsed: string; // Snapshot of details used for audit
  transactionId?: string | null; // Can be string or null, not undefined
  receiptUrl: string; // URL to the uploaded receipt in Firebase Storage
  uploadedAt: Timestamp;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  adminNotes?: string;
  installmentNumber?: number;
}

// Hardcoded EduLX Packages based on your image
const EDULX_PACKAGES: EduLXPackage[] = [
  {
    name: 'Starter',
    price: 39999,
    description: 'Basic support for your study abroad journey.',
    features: [
      'Admission Guarantee', '5 Applications', '1 Intake Validity', 'Email Counsellor Support',
      '1 SOP Draft', 'CV Preparation', 'University Applications', 'Couriers (2 Apps)',
      'Block Account Opening', 'Visa Guidance', 'Education Loan', 'Banking Support'
    ],
  },
  {
    name: 'Pro',
    price: 69999,
    installments: 3,
    description: 'Enhanced support with more applications and personalized guidance.',
    features: [
      '10 Applications', '1 Intake Validity', 'Zoom Counsellor Support',
      '2 SOP Drafts', 'LOR Writing', 'CV Preparation', 'APS Application', 'Tailored University Shortlisting',
      'University Applications', 'Basic ECTS Form Filling', 'Custom Questionnaires',
      'Block Account Opening', 'Visa Guidance', 'Visa Slot Booking', 'Health + Travel Ins.', 'Education Loan',
      'City Registration', 'Banking Support', 'E-sim card'
    ],
  },
  {
    name: 'Premium',
    price: 129999,
    installments: 3,
    description: 'Comprehensive, unlimited support for all your needs.',
    features: [
      'Admission Guarantee', 'Unlimited Applications', '2 Intakes Validity', 'Mentor Counsellor Support',
      'Unlimited SOP Drafts', 'LOR Writing', 'CV Preparation', 'APS Application', 'Tailored University Shortlisting',
      'University Applications', 'Uni-Assist Fee', 'Couriers (2 Apps)', 'ECTS Form Filling', 'Custom Questionnaires',
      'Block Account Account Opening', 'Visa Guidance', 'Visa Slot Booking', 'Health + Travel Ins.', 'Education Loan',
      'Housing Support', 'City Registration', 'Banking Support', 'E-sim card', 'Resident Visa'
    ],
  },
];

// Hardcoded Banking Details
const BANKING_DETAILS = {
  accountName: 'Gaurav Chandrakant Shinde',
  accountNumber: '337901509789',
  bankName: 'ICICI Bank Ltd.,Pune-Manjari Road Hadapsar',
  ifscCode: 'ICIC0003379',
};

const EdulxPayments: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<EduLXPackage | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  // State to manage the visibility of all features for each package card
  const [showAllFeatures, setShowAllFeatures] = useState<{ [key: string]: boolean }>({});

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setPayments([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch Payments from Firestore (real-time)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Firestore paths for payments remain 'users' as they are associated with the user's Auth UID
    const paymentsCollectionRef = collection(db, `users/${user.uid}/payments`);
    const q = query(paymentsCollectionRef);

    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const paymentsData: PaymentRecord[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt instanceof Timestamp ? doc.data().uploadedAt : Timestamp.now(), // Ensure Timestamp type
          amountPaid: Number(doc.data().amountPaid) || 0,
          packagePrice: Number(doc.data().packagePrice) || 0,
        })) as PaymentRecord[];
        setPayments(paymentsData.sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis())); // Sort by newest first
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching payments:", error);
        message.error("Failed to fetch payment history. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore();
  }, [user]);

  const showPaymentModal = (pkg: EduLXPackage) => {
    if (!user) {
      message.error("Please log in to make a payment.");
      return;
    }
    setSelectedPackage(pkg);
    form.resetFields();
    setFileList([]); // Clear previously selected files
    form.setFieldsValue({
      packageName: pkg.name,
      packagePrice: `₹${pkg.price.toLocaleString('en-IN')}`, // Display formatted price
      amountPaid: pkg.name === 'Starter' ? pkg.price : undefined, // Pre-fill Starter amount, or leave undefined for others
      installmentNumber: undefined, // Clear installment number on modal open
    });
    setIsPaymentModalVisible(true);
  };

  const handlePaymentModalCancel = () => {
    setIsPaymentModalVisible(false);
    setSelectedPackage(null);
    form.resetFields();
    setFileList([]);
  };

  // Handles installment number change to auto-fill amount
  const handleInstallmentChange = (value: number) => {
    if (selectedPackage && selectedPackage.installments) {
      const amountPerInstallment = selectedPackage.price / selectedPackage.installments;
      form.setFieldsValue({
        amountPaid: amountPerInstallment,
      });
    }
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPngOrPdf = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf';
    if (!isJpgOrPngOrPdf) {
      message.error('You can only upload JPG/PNG/PDF file!');
      return Upload.LIST_IGNORE; // Prevent upload
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Receipt must be smaller than 5MB!');
      return Upload.LIST_IGNORE; // Prevent upload
    }
    setFileList([file]); // Only allow one file
    return false; // Prevent automatic upload
  };

  const handlePaymentSubmit = async (values: any) => {
    if (!user || !selectedPackage || fileList.length === 0) {
      message.error("Please fill all details and upload a receipt.");
      return;
    }

    // Validate amountPaid for positive number before submission
    const amountPaidValue = Number(values.amountPaid);
    if (isNaN(amountPaidValue) || amountPaidValue <= 0) {
        message.error("Amount must be a positive number!");
        return;
    }

    const file = fileList[0];
    const fileName = `${selectedPackage.name}_${dayjs().format('YYYYMMDDHHmmss')}_${file.name}`;
    // --- UPDATED STORAGE PATH: Now uses 'students' ---
    const storagePath = `students/${user.uid}/payment_receipts/${fileName}`;
    const receiptRef = storageRef(storage, storagePath);

    setLoading(true);
    try {
      // Upload receipt to Firebase Storage
      await uploadBytes(receiptRef, file);
      const receiptUrl = await getDownloadURL(receiptRef);

      // Save payment record to Firestore
      const paymentData: PaymentRecord = {
        userId: user.uid,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        amountPaid: amountPaidValue, // Use validated amount
        paymentMethod: values.paymentMethod,
        bankDetailsUsed: JSON.stringify(BANKING_DETAILS), // Store a snapshot of details
        // --- FIX FOR UNDEFINED ERROR: Use null if transactionId is empty ---
        transactionId: values.transactionId || null,
        // --- END FIX ---
        receiptUrl: receiptUrl,
        uploadedAt: Timestamp.now(),
        status: 'Pending Review', // Initial status
        installmentNumber: values.installmentNumber,
      };

      // Firestore paths for payments remain 'users'
      await addDoc(collection(db, `users/${user.uid}/payments`), paymentData);
      message.success('Payment receipt uploaded successfully! Awaiting review.');
      handlePaymentModalCancel();
    } catch (error) {
      console.error("Error submitting payment:", error);
      message.error("Failed to submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string, receiptUrl: string) => {
    if (!user) {
      message.error("Authentication required to delete payment records.");
      return;
    }

    setLoading(true);
    try {
      // Delete from Firestore
      // Firestore paths remain 'users'
      await deleteDoc(doc(db, `users/${user.uid}/payments`, paymentId));

      // Delete from Storage if URL exists
      if (receiptUrl) {
        // IMPORTANT: The receiptUrl stored in Firestore will have the full path
        // (either 'users/...' for old payments or 'students/...' for new ones).
        // `storageRef(storage, receiptUrl)` correctly handles this as long as the URL is the full path.
        const fileRef = storageRef(storage, receiptUrl);
        await deleteObject(fileRef).catch((e) => console.warn("Could not delete file from storage (might not exist or permission denied):", e));
      }

      message.success('Payment record deleted successfully!');
    } catch (error) {
      console.error("Error deleting payment record:", error);
      message.error("Failed to delete payment record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-500';
      case 'Rejected': return 'text-red-500';
      case 'Pending Review': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircleOutlined className="mr-1" />;
      case 'Rejected': return <CloseCircleOutlined className="mr-1" />;
      case 'Pending Review': return <ClockCircleOutlined className="mr-1" />;
      default: return null;
    }
  };

  const columns = [
    {
      title: 'Package',
      dataIndex: 'packageName',
      key: 'packageName',
      render: (text: string, record: PaymentRecord) => (
        <span>
          {text} {record.installmentNumber ? `(Installment ${record.installmentNumber})` : ''}
        </span>
      ),
    },
    {
      title: 'Amount Paid (₹)',
      dataIndex: 'amountPaid',
      key: 'amountPaid',
      render: (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
    },
    {
      title: 'Uploaded On',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (ts: Timestamp) => dayjs(ts.toDate()).format('MMM D,YYYY h:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={`font-semibold ${getStatusColor(status)}`}>
          {getStatusIcon(status)}{status}
        </span>
      ),
    },
    {
      title: 'Receipt',
      dataIndex: 'receiptUrl',
      key: 'receiptUrl',
      render: (url: string) => (
        url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Receipt</a> : 'N/A'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: PaymentRecord) => (
        <Popconfirm
          title="Are you sure you want to delete this payment record?"
          onConfirm={() => record.id && handleDeletePayment(record.id, record.receiptUrl)}
          okText="Yes"
          cancelText="No"
        >
          <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4 text-dark dark:text-white">EduLX Payments</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Please log in to manage your payments.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Title level={2} className="text-dark dark:text-white mb-6">
        Edulx Payment & Package Selection
      </Title>

      {/* Package Selection Section */}
      <Card className="mb-8 bg-white dark:bg-darkgray shadow-md rounded-lg">
        <Title level={3} className="text-dark dark:text-white mb-4">
          Choose Your Edulx Package
        </Title>
        <Row gutter={[16, 16]} justify="center">
          {EDULX_PACKAGES.map((pkg) => (
            <Col xs={24} md={8} key={pkg.name}>
              <Card
                // Added responsive title for smaller screens
                title={<span className="text-dark dark:text-white text-base sm:text-lg lg:text-xl">{pkg.name}</span>}
                extra={
                  <Button
                    type="primary"
                    onClick={() => showPaymentModal(pkg)}
                    className="bg-primary text-white hover:bg-yellow-500 transition-colors"
                    style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
                  >
                    Select Package
                  </Button>
                }
                className="package-card dark:border-gray-700 h-full flex flex-col justify-between"
                headStyle={{ borderBottom: '1px solid #e8e8e8', paddingBottom: '16px' }}
                bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <Text strong className="text-2xl text-primary block mb-2">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </Text>
                  {pkg.installments && (
                    <Text type="secondary" className="block text-sm mb-2">
                      ({pkg.installments} Installments)
                    </Text>
                  )}
                  <Paragraph className="text-gray-700 dark:text-gray-300 text-sm">
                    {pkg.description}
                  </Paragraph>
                  <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 text-sm">
                    {/* Render features based on showAllFeatures state */}
                    {showAllFeatures[pkg.name]
                      ? pkg.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))
                      : pkg.features.slice(0, 5).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                    {pkg.features.length > 5 && (
                      <li
                        className="italic cursor-pointer text-blue-500 hover:underline"
                        onClick={() =>
                          setShowAllFeatures((prev) => ({
                            ...prev,
                            [pkg.name]: !prev[pkg.name],
                          }))
                        }
                      >
                        {showAllFeatures[pkg.name] ? '...show less' : '...and more!'}
                      </li>
                    )}
                  </ul>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Banking Details and QR Code Section */}
      <Card className="mb-8 bg-white dark:bg-darkgray shadow-md rounded-lg">
        <Title level={3} className="text-dark dark:text-white mb-4">
          Payment Details
        </Title>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <div className="mb-4">
              <Text strong className="block text-dark dark:text-white text-lg mb-2">Bank Account Details:</Text>
              <Paragraph className="text-gray-700 dark:text-gray-300">
                <Text strong className="block">Account Name:</Text> {BANKING_DETAILS.accountName}<br />
                <Text strong className="block">Account Number:</Text> {BANKING_DETAILS.accountNumber}<br />
                <Text strong className="block">Bank:</Text> {BANKING_DETAILS.bankName}<br />
                <Text strong className="block">IFSC Code:</Text> {BANKING_DETAILS.ifscCode}
              </Paragraph>
            </div>
          </Col>
          <Col xs={24} md={12} className="text-center">
            <Text strong className="block text-dark dark:text-white text-lg mb-2">Scan for UPI Payment:</Text>
            <img
              src={UPI_QR_CODE} // Use the imported image
              alt="QR Code for Payment"
              className="max-w-[250px] mx-auto border border-gray-300 rounded"
            />
            <Paragraph type="secondary" className="mt-2 text-gray-600 dark:text-gray-400">
              (Use any UPI app to scan and pay)
            </Paragraph>
          </Col>
        </Row>
      </Card>

      {/* Payment History Section */}
      <Card className="bg-white dark:bg-darkgray shadow-md rounded-lg">
        <Title level={3} className="text-dark dark:text-white mb-4">
          Your Payment History
        </Title>
        <Spin spinning={loading}>
          <Table
            dataSource={payments}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            className="payment-history-table"
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <Text type="secondary">No payments uploaded yet.</Text> }}
          />
        </Spin>
      </Card>

      {/* Payment Upload Modal */}
      <Modal
        title={<span className="text-dark dark:text-white">Upload Payment Receipt for {selectedPackage?.name}</span>}
        open={isPaymentModalVisible}
        onCancel={handlePaymentModalCancel}
        footer={null}
        centered
        width={600}
        destroyOnHidden={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePaymentSubmit}
          initialValues={{ paymentMethod: 'Bank Transfer' }} // Default payment method
        >
          <Form.Item name="packageName" label="Selected Package">
            <Input disabled />
          </Form.Item>
          <Form.Item name="packagePrice" label="Package Price">
            <Input disabled />
          </Form.Item>

          {selectedPackage?.name !== 'Starter' && (
            <Form.Item
              name="installmentNumber"
              label="Installment Number"
              rules={[{ required: true, message: 'Please select installment number!' }]}
            >
              <Select placeholder="e.g., 1st, 2nd, 3rd" onChange={handleInstallmentChange}>
                {selectedPackage?.installments &&
                  Array.from({ length: selectedPackage.installments }, (_, i) => i + 1).map((num) => (
                    <Option key={num} value={num}>{`${num}${num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'} Installment`}</Option>
                  ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="amountPaid"
            label="Amount You Paid (₹)"
            rules={[
              { required: true, message: 'Please enter the amount you paid!' },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === '') {
                    return Promise.reject(new Error('Please enter the amount you paid!'));
                  }
                  const numValue = Number(value);
                  if (isNaN(numValue) || numValue <= 0) {
                    return Promise.reject(new Error('Amount must be a positive number!'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input type="number" placeholder="e.g., 23333 (for an installment) or 69999" />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select payment method!' }]}
          >
            <Select>
              <Option value="Bank Transfer">Bank Transfer</Option>
              <Option value="UPI">UPI (QR Code)</Option>
              {/* Add other methods if applicable */}
            </Select>
          </Form.Item>

          <Form.Item name="transactionId" label="Transaction ID (Optional)">
            <Input placeholder="Enter transaction ID if available" />
          </Form.Item>

          <Form.Item
            name="receiptUpload"
            label="Upload Payment Receipt (JPG, PNG, PDF)"
            valuePropName="fileList"
            getValueFromEvent={(e: any) => e?.fileList}
            rules={[{ required: true, message: 'Please upload your payment receipt!' }]}
          >
            <Upload
              accept=".jpg,.jpeg,.png,.pdf"
              maxCount={1}
              beforeUpload={beforeUpload}
              onRemove={() => setFileList([])}
              fileList={fileList}
            >
              <Button icon={<UploadOutlined />} >Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item className="mt-4 flex justify-end">
            <Button onClick={handlePaymentModalCancel} className="mr-2 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<DollarOutlined />}
              className="bg-primary text-white hover:bg-yellow-500 transition-colors"
              style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
              loading={loading}
            >
              Submit Payment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EdulxPayments;