// src/views/student/TotalExpense.tsx
// This file is already well-structured and doesn't need further changes for the dashboard card feature.

import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Input, Select, DatePicker, message, Card, Statistic, Table, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, Timestamp } from 'firebase/firestore'; // Removed getDocs, where as they are not used directly in this snippet after onSnapshot
import { db, auth } from 'src/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const { Option } = Select;

// Define the interface for an Expense
export interface Expense { // Exported for use in other files like the custom hook
  id?: string;
  userId: string;
  expenseType: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD format (ISO string)
  packageType?: 'Pro' | 'Premium';
  installmentNumber?: number;
}

// Define the pre-defined expense types
const EXPENSE_CATEGORIES = [
  "Application Fees",
  "Visa Fees",
  "University Specific Application Fees",
  "Uni-Assist Application Fees",
  "Insurance (Health/Travel)",
  "Air Ticket",
  "Accommodation (Initial)",
  "Blocked Account Deposit",
  "Travel Expense (Initial)",
  "Shopping for Abroad Stay",
  "EduLX Package",
  "Other"
];

// EduLX Package Details
const EDULX_PACKAGES = {
  Pro: {
    price: 69999,
    installments: 3,
  },
  Premium: {
    price: 129999,
    installments: 3,
  },
};

const TotalExpense: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();
  const [selectedExpenseType, setSelectedExpenseType] = useState<string | null>(null);
  const [selectedPackageType, setSelectedPackageType] = useState<'Pro' | 'Premium' | null>(null);

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setExpenses([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch Expenses from Firestore (real-time)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const expensesCollectionRef = collection(db, `users/${user.uid}/expenses`);
    const q = query(expensesCollectionRef);

    const unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        const expensesData: Expense[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          amount: Number(doc.data().amount) || 0,
          date: doc.data().date instanceof Timestamp ? dayjs(doc.data().date.toDate()).format('YYYY-MM-DD') : doc.data().date,
        })) as Expense[];
        setExpenses(expensesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching expenses:", error);
        message.error("Failed to fetch expenses. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribeFirestore();
  }, [user]);

  const totalExpenditure = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const showModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      form.setFieldsValue({
        ...expense,
        date: dayjs(expense.date),
      });
      setSelectedExpenseType(expense.expenseType);
      if (expense.expenseType === "EduLX Package") {
        setSelectedPackageType(expense.packageType || null);
      } else {
        setSelectedPackageType(null);
      }
    } else {
      setEditingExpense(null);
      form.resetFields();
      setSelectedExpenseType(null);
      setSelectedPackageType(null);
      form.setFieldValue('date', dayjs());
      form.setFieldValue('amount', null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingExpense(null);
    form.resetFields();
    setSelectedExpenseType(null);
    setSelectedPackageType(null);
  };

  const handleExpenseTypeChange = (value: string) => {
    setSelectedExpenseType(value);
    setSelectedPackageType(null);
    if (value !== "EduLX Package") {
      form.setFieldsValue({ packageType: undefined, amount: null, description: undefined });
    }
  };

  const handlePackageTypeChange = (value: 'Pro' | 'Premium') => {
    setSelectedPackageType(value);
    const packageInfo = EDULX_PACKAGES[value];
    if (packageInfo) {
      const installmentAmount = Math.ceil(packageInfo.price / packageInfo.installments);
      form.setFieldsValue({
        amount: installmentAmount,
        description: `${value} Package - Installment (1 of ${packageInfo.installments})`,
      });
    }
  };

  const handleFormSubmit = async (values: any) => {
    if (!user) {
      message.error("Please log in to save expenses.");
      return;
    }

    const parsedAmount = Number(values.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        message.error("Amount must be a positive number.");
        return;
    }

    setLoading(true);
    const expenseData: Expense = {
      userId: user.uid,
      expenseType: values.expenseType,
      description: values.description,
      amount: parsedAmount,
      date: values.date.format('YYYY-MM-DD'),
      ...(values.expenseType === "EduLX Package" && {
        packageType: values.packageType,
        installmentNumber: values.installmentNumber || 1,
      }),
    };

    try {
      if (editingExpense?.id) {
        const docRef = doc(db, `users/${user.uid}/expenses`, editingExpense.id);
        await updateDoc(docRef, expenseData);
        message.success('Expense updated successfully!');
      } else {
        await addDoc(collection(db, `users/${user.uid}/expenses`), expenseData);
        message.success('Expense added successfully!');
      }
      handleCancel();
    } catch (error) {
      console.error("Error saving expense:", error);
      message.error("Failed to save expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!user) {
      message.error("Please log in to delete expenses.");
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/expenses`, expenseId));
      message.success('Expense deleted successfully!');
    } catch (error) {
      console.error("Error deleting expense:", error);
      message.error("Failed to delete expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('MMM D, YYYY'),
      sorter: (a: Expense, b: Expense) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Expense Type',
      dataIndex: 'expenseType',
      key: 'expenseType',
      sorter: (a: Expense, b: Expense) => a.expenseType.localeCompare(b.expenseType),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
      sorter: (a: Expense, b: Expense) => a.amount - b.amount,
      align: 'right' as 'right',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Expense) => (
        <div className="flex space-x-2 justify-end">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this expense?"
            onConfirm={() => record.id && handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
      align: 'center' as 'center',
      width: 150,
    },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4 text-dark dark:text-white">Total Expenditure Tracker</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Please log in to track your expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-dark dark:text-white mb-6">
        Total Expenditure Tracker
      </h2>

      <Card className="mb-6 bg-white dark:bg-darkgray shadow-md rounded-lg">
        <Statistic
          title={<span className="text-dark dark:text-white">Total Expenditure</span>}
          value={totalExpenditure}
          precision={0}
          valueStyle={{ color: '#FBCC32' }}
          formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
        />
      </Card>

      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          className="bg-primary text-white hover:bg-yellow-500 transition-colors"
          style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
        >
          Add New Expense
        </Button>
      </div>

      <Card className="bg-white dark:bg-darkgray shadow-md rounded-lg">
        <Table
          dataSource={expenses}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="expense-table"
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={<span className="text-dark dark:text-white">{editingExpense ? "Edit Expense" : "Add New Expense"}</span>}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        width={600}
        destroyOnHidden={true}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ date: dayjs() }}
        >
          <Form.Item
            name="expenseType"
            label="Expense Type"
            rules={[{ required: true, message: 'Please select an expense type!' }]}
          >
            <Select
              placeholder="Select Expense Type"
              onChange={handleExpenseTypeChange}
              className="select-md"
            >
              {EXPENSE_CATEGORIES.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>

          {selectedExpenseType === "EduLX Package" && (
            <Form.Item
              name="packageType"
              label="Select Package"
              rules={[{ required: true, message: 'Please select a package!' }]}
            >
              <Select
                placeholder="Select EduLX Package"
                onChange={handlePackageTypeChange}
                className="select-md"
              >
                <Option value="Pro">Pro (₹69,999)</Option>
                <Option value="Premium">Premium (₹1,29,999)</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description!' }]}
          >
            <Input.TextArea rows={2} placeholder="e.g., Application for UofT, Visa appointment, Flight to Toronto" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[
              { required: true, message: 'Please enter the amount!' },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === '') {
                    return Promise.reject(new Error('Please enter the amount!'));
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
            <Input type="number" placeholder="e.g., 10000" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select the date!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item className="mt-4 flex justify-end">
            <Button onClick={handleCancel} className="mr-2 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              className="bg-primary text-white hover:bg-yellow-500 transition-colors"
              style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }}
            >
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TotalExpense;