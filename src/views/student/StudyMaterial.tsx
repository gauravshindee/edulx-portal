import React, { useState, useEffect } from 'react';
import { Card, Typography, List, Button, Modal, Spin, message, Row, Col } from 'antd';
import { FolderOutlined, FilePdfOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { Document, Page, pdfjs } from 'react-pdf';
import { saveAs } from 'file-saver';

// Configure pdfjs worker source
// Ensure you have 'pdf.worker.min.js' copied to your public/pdf-worker/ folder.
pdfjs.GlobalWorkerOptions.workerSrc = '/portal/pdf-worker/pdf.worker.min.js';

const { Title, Text } = Typography;

// --- Study Material Data Structure with Firebase Storage URLs ---
// These URLs are direct download links from Firebase Storage.
const STUDY_MATERIALS_STRUCTURE = {
  'German-Language': [
    { name: 'A1 Course Book', path: 'https://firebasestorage.googleapis.com/v0/b/edulx-platform-8aa10.firebasestorage.app/o/study-materials%2FGerman-Language%2FA1.pdf?alt=media&token=152560b6-4035-4584-bffb-644d8ee04da4' },
    { name: 'A2 Grammar Guide', path: 'https://firebasestorage.googleapis.com/v0/b/edulx-platform-8aa10.firebasestorage.app/o/study-materials%2FGerman-Language%2FA2.pdf?alt=media&token=7cd5252c-b847-42e2-b71f-d798612855c4' },
  ],
  'GRE': [
    { name: 'GRE Study Guide', path: 'https://firebasestorage.googleapis.com/v0/b/edulx-platform-8aa10.firebasestorage.app/o/study-materials%2FGRE%2FGRE-Study.pdf?alt=media&token=2bd194b6-a8c4-4fa4-82d7-ea5bd0c73682' },
  ],
  'IELTS': [
    { name: 'Cambridge IELTS 19', path: 'https://firebasestorage.googleapis.com/v0/b/edulx-platform-8aa10.firebasestorage.app/o/study-materials%2FIELTS%2FCambridge-Ielts-19.pdf?alt=media&token=75a433eb-15fb-4d57-bde1-c1003199ef73' },
  ],
  'TestAS': [
    { name: 'TestAS Practice Book', path: 'https://firebasestorage.googleapis.com/v0/b/edulx-platform-8aa10.firebasestorage.app/o/study-materials%2FTestAS%2FBook.pdf?alt=media&token=f579ba0a-ad44-453c-8aba-3aa198c15294' },
  ],
  'TestDaf': [
    { name: 'TestDaf Official Guide', path: 'https://firebasestorage.googleapis.com/v0/b/edulx-platform-8aa10.firebasestorage.app/o/study-materials%2FTestDaf%2FTestDaf.pdf?alt=media&token=a28d2109-59c1-4060-8acd-ec364c240bf4' },
  ],
};

// Define interfaces for better type safety
interface StudyMaterialItem {
  name: string;
  path: string; // The URL to the PDF (now Firebase Storage URL)
}

interface StudyMaterialCategory {
  name: string;
  materials: StudyMaterialItem[];
}

const StudyMaterial: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfLoading, setPdfLoading] = useState(true);

  // Directly convert the hardcoded structure into the format needed for display
  const studyCategories: StudyMaterialCategory[] = Object.keys(STUDY_MATERIALS_STRUCTURE).map(categoryName => ({
    name: categoryName,
    materials: (STUDY_MATERIALS_STRUCTURE as any)[categoryName],
  }));

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentPdfUrl(null); // Ensure PDF viewer is reset
  };

  const handleViewPdf = (url: string) => {
    setCurrentPdfUrl(url);
    setPdfModalVisible(true);
    setPageNumber(1); // Reset to first page
    setNumPages(null); // Reset page count
    setPdfLoading(true);
  };

  const handleDownloadPdf = (url: string, fileName: string) => {
    message.loading({ content: 'Preparing download...', key: 'download' });
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        saveAs(blob, fileName);
        message.success({ content: 'Download complete!', key: 'download', duration: 2 });
      })
      .catch(error => {
        console.error('Error downloading PDF:', error);
        message.error({ content: `Failed to download PDF: ${error.message}. Please try again.`, key: 'download', duration: 3 });
      });
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
  };

  const onDocumentLoadError = (error: any) => {
    console.error('Error loading PDF document:', error);
    message.error(`Failed to load PDF: ${error.message}. Please check console for details.`);
    setPdfLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => (prevPageNumber || 1) + offset);
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <Title level={2} className="text-dark dark:text-white mb-6">
        Study Material
      </Title>

      {!selectedCategory ? (
        // Category List View
        <Row gutter={[16, 16]} className="justify-center">
          {studyCategories.map(category => (
            <Col xs={24} sm={12} md={8} lg={6} key={category.name}>
              <Card
                hoverable
                className="category-card dark:bg-darkgray dark:border-gray-700 shadow-md rounded-lg text-center h-full flex flex-col justify-center items-center"
                onClick={() => handleCategoryClick(category.name)}
              >
                <FolderOutlined className="text-primary text-5xl mb-4" />
                <Title level={4} className="text-dark dark:text-white mb-0">
                  {category.name}
                </Title>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // PDF List within a Category View
        <Card className="bg-white dark:bg-darkgray shadow-md rounded-lg">
          <Button onClick={handleBackToCategories} className="mb-4 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600">
            ← Back to Categories
          </Button>
          <Title level={3} className="text-dark dark:text-white mb-4">
            {selectedCategory}
          </Title>
          <List
            itemLayout="horizontal"
            dataSource={studyCategories.find(cat => cat.name === selectedCategory)?.materials}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handleViewPdf(item.path)}
                    className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    View
                  </Button>,
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadPdf(item.path, item.name + '.pdf')}
                    className="dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Download
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FilePdfOutlined className="text-red-500 text-2xl" />}
                  title={<Text className="text-dark dark:text-white">{item.name}</Text>}
                />
              </List.Item>
            )}
            locale={{ emptyText: <Text type="secondary">No study materials found in this category.</Text> }}
          />
        </Card>
      )}

      {/* PDF Viewer Modal */}
      <Modal
        title={<span className="text-dark dark:text-white">PDF Viewer</span>}
        open={pdfModalVisible}
        onCancel={() => setPdfModalVisible(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        styles={{ body: { overflowY: 'auto', maxHeight: 'calc(100vh - 150px)' } }}
        destroyOnClose
      >
        <div className="flex flex-col items-center">
          {currentPdfUrl ? (
            <Spin spinning={pdfLoading} tip="Loading PDF...">
              <Document
                file={currentPdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className="border dark:border-gray-700 rounded-md shadow-md my-4"
              >
                <Page pageNumber={pageNumber} width={Math.min(window.innerWidth * 0.7, 800)} />
              </Document>
            </Spin>
          ) : (
            <Text type="secondary">No PDF selected.</Text>
          )}

          {numPages && (
            <div className="flex items-center justify-center mt-4 mb-4">
              <Button
                onClick={previousPage}
                disabled={pageNumber <= 1 || pdfLoading}
                className="mr-2 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Previous
              </Button>
              <Text className="text-dark dark:text-white">
                Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
              </Text>
              <Button
                onClick={nextPage}
                disabled={pageNumber >= numPages || pdfLoading}
                className="ml-2 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StudyMaterial;