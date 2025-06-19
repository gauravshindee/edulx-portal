import { useState } from 'react';
import { Button, Modal } from 'antd'; // Import Ant Design Button and Modal
import { ShareAltOutlined } from '@ant-design/icons'; // For the share icon

const ShareAndEarn = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // The text to be shared, including the phone numbers
  const shareText = "Hey there! I'm using EduLX for my higher education journey, and it's been super helpful with profile management, document uploads, and even SOP assistance. You should check them out! For more info, call us on 8983605225 or 8149365225.";

  const handleShareClick = () => {
    // Check if the Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: 'EduLX - Your Partner in Higher Education',
        text: shareText,
        url: window.location.origin, // Shares the current domain of your app
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that do not support Web Share API
      // Open a modal with copy text or direct links to platforms
      setIsModalVisible(true);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    alert('Share message copied to clipboard!');
    setIsModalVisible(false);
  };

  return (
    <>
      <div className="p-5 mt-auto"> {/* Use mt-auto to push it to the bottom of the sidebar */}
        <div className="bg-lightprimary rounded-md p-4 text-center">
          <h4 className="text-primary font-semibold mb-2 text-base">
            Share to Friends/Family and get commissions!
          </h4>
          <p className="text-sm text-bodytext mb-4">
       
          </p>
          <Button
            type="primary" // Use Ant Design's primary button style
            icon={<ShareAltOutlined />} // Add a share icon
            onClick={handleShareClick}
            className="w-full text-white px-4 py-2 rounded shadow transition"
            style={{ backgroundColor: '#FBCC32', borderColor: '#FBCC32' }} // Apply custom primary color
          >
            Share to Friends/Family
          </Button>
        </div>
      </div>

      {/* Modal for fallback sharing options for browsers without Web Share API */}
      <Modal
        title="Share EduLX"
        open={isModalVisible} // Use 'open' for Ant Design v5+
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="copy" onClick={handleCopyText} style={{ backgroundColor: '#374151', color: 'white' }}>
            Copy Message
          </Button>,
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <p className="mb-4">
          Unfortunately, your browser doesn't support direct sharing. You can copy the message below and share it manually:
        </p>
        <textarea
          readOnly
          value={shareText}
          className="w-full p-2 border rounded-md text-sm"
          rows={5}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()} // Select text on click
        />
        <p className="mt-4 text-xs text-gray-500">
          You can also manually share this link: {window.location.origin}
        </p>
      </Modal>
    </>
  );
};

export default ShareAndEarn;