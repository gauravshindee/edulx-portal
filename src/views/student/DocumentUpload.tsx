import { useState, useEffect } from "react";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  deleteObject,
  getBlob,
} from "firebase/storage";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { storage, db } from "src/firebase";
import { useAuth } from "src/context/AuthContext";
import { DOCUMENT_TYPES } from "src/constants/DOCUMENT_TYPES";
import { Progress } from 'antd'; // Added import for Ant Design Progress

// Helper functions
const sanitize = (type: string) => type.replace(/[\/.#$[\]]/g, "_");
const isImage = (fileType: string) => fileType.startsWith("image/");
const formatDate = (ts: any) => {
  const date = ts?.toDate?.() ?? new Date(ts);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const DocumentUpload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<{ [type: string]: any[] }>({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (user) fetchAllVersions();
  }, [user]);

  const fetchAllVersions = async () => {
    if (!user) return;
    setLoading(true);
    const allDocs: { [type: string]: any[] } = {};
    for (const type of DOCUMENT_TYPES) {
      const safeType = sanitize(type);
      try {
        const uploadsRef = collection(
          doc(db, "users", user.uid, "documents", safeType),
          "uploads"
        );
        const snapshot = await getDocs(uploadsRef);
        allDocs[type] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (err) {
        console.error(`Error loading "${type}"`, err);
        allDocs[type] = [];
      }
    }
    setFiles(allDocs);
    setLoading(false);
  };

  const handleUpload = async (type: string, file: File) => {
    if (!user || !file) return;

    if (type === "Passport Size Photo" && !isImage(file.type)) {
      return setStatus("❌ Only image files are allowed for Passport Size Photo.");
    }
    if (type !== "Passport Size Photo" && file.type !== "application/pdf") {
      return setStatus("❌ Only PDF files are allowed for this document type.");
    }

    setStatus("Uploading...");
    try {
      const safeType = sanitize(type);
      const path = `students/${user.uid}/${safeType}/${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);

      const uploadsRef = collection(
        doc(db, "users", user.uid, "documents", safeType),
        "uploads"
      );
      const newDoc = await addDoc(uploadsRef, {
        url, // for user preview only
        name: file.name, // this is critical for zip logic
        uploadedAt: Timestamp.now(),
      });

      setFiles((prev) => ({
        ...prev,
        [type]: [...(prev[type] || []), {
          id: newDoc.id,
          url,
          name: file.name,
          uploadedAt: Timestamp.now(),
        }],
      }));
      setStatus(`🎉 "${type}" uploaded successfully!`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed. Try again.");
    }
  };

  const handleDelete = async (type: string, fileId: string, fileName: string) => {
    if (!user) return;
    try {
      const safeType = sanitize(type);
      const path = `students/${user.uid}/${safeType}/${fileName}`;
      const ref = storageRef(storage, path);
      await deleteObject(ref);

      const docRef = doc(
        db,
        "users",
        user.uid,
        "documents",
        safeType,
        "uploads",
        fileId
      );
      await deleteDoc(docRef);

      setFiles((prev) => ({
        ...prev,
        [type]: prev[type].filter((doc) => doc.id !== fileId),
      }));
      setStatus(`🗑 "${type}" deleted.`);
    } catch (error) {
      console.error("Delete error:", error);
      setStatus("❌ Could not delete document.");
    }
  };

  const handleExportAll = async () => {
    if (!user) return;
    const zip = new JSZip();
    setStatus("⏳ Preparing ZIP...");
    try {
      for (const type of DOCUMENT_TYPES) {
        const safeType = sanitize(type);
        const uploadsRef = collection(
          doc(db, "users", user.uid, "documents", safeType),
          "uploads"
        );
        const snapshot = await getDocs(uploadsRef);
        const folder = zip.folder(safeType);

        for (const docSnap of snapshot.docs) {
          const fileData = docSnap.data();
          const fileName = fileData.name;
          const filePath = `students/${user.uid}/${safeType}/${fileName}`;
          const fileRef = storageRef(storage, filePath);
          try {
            const blob = await getBlob(fileRef);
            folder?.file(fileName, blob);
          } catch (err) {
            console.warn(`⚠️ Skipping "${fileName}" - permission issue or not found.`, err);
            // This warning is fine; it means that file couldn't be added to zip.
            // CORS issue will be resolved by gsutil command.
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const displayName = user.displayName?.replace(/\s+/g, "_") || user.uid;
      saveAs(zipBlob, `${displayName}_Documents.zip`);
      setStatus("✅ ZIP ready. Download started!");
    } catch (err) {
      console.error("❌ ZIP generation failed:", err);
      setStatus("❌ ZIP failed. Check console.");
    }
  };

  const total = DOCUMENT_TYPES.length;
  const uploaded = Object.values(files).filter((arr) => arr.length > 0).length;
  const missing = total - uploaded;
  const completionPercentage = total === 0 ? 0 : (uploaded / total) * 100;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex-1 min-w-[250px]">
          <h2 className="text-xl font-semibold mb-2">
            Upload Your Admission Documents
          </h2>
          <Progress
            percent={completionPercentage}
            status={completionPercentage === 100 ? 'success' : 'active'}
            format={(percent) => `${uploaded}/${total} Uploaded (${(percent ?? 0).toFixed(0)}%)`}
            strokeColor={{
              from: '#374151', // Dark grey/blue
              to: '#FBCC32',   // Yellow/gold
            }}
          />
          <p className="text-sm text-gray-500 mt-1">
            ({missing} Documents Still Missing)
          </p>
        </div>
        <button
          onClick={handleExportAll}
          // The button already uses bg-primary; ensure 'primary' is your #FBCC32
          className="bg-primary text-white text-sm px-4 py-2 rounded shadow hover:bg-yellow-500 transition"
        >
          Download All as ZIP
        </button>
      </div>
      {status && (
        <div className="mb-4 p-2 text-sm bg-blue-50 text-blue-700 rounded text-center">
          {status}
        </div>
      )}
      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading documents...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {DOCUMENT_TYPES.map((type) => (
            <div key={type} className="border p-4 rounded-xl bg-white shadow-sm">
              <h4 className="font-medium text-md mb-2">{type}</h4>
              {(files[type] || []).length > 0 ? (
                <ul className="text-xs text-gray-700 space-y-2 mb-2">
                  {files[type].map((file: any) => (
                    <li key={file.id}>
                      <div className="flex justify-between items-center">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {file.name}
                        </a>
                        <button
                          onClick={() => handleDelete(type, file.id, file.name)}
                          className="text-red-600 hover:underline text-xs ml-2"
                        >
                          Delete
                        </button>
                      </div>
                      {file.uploadedAt && (
                        <p className="text-[11px] text-gray-500 italic">
                          Uploaded on: {formatDate(file.uploadedAt)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500 mb-2">No documents uploaded</p>
              )}
              <input
                type="file"
                accept={type === "Passport Size Photo" ? "image/*" : "application/pdf"}
                onChange={(e) =>
                  e.target.files && handleUpload(type, e.target.files[0])
                }
                className="mt-2 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;