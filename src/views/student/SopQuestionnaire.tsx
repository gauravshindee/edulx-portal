import { useEffect, useState } from "react";
import {
  doc, getDoc, setDoc, updateDoc
} from "firebase/firestore";
import { db } from "src/firebase";
import { useAuth } from "src/context/AuthContext";
import { Progress } from 'antd'; // Import Ant Design Progress component

// Define your SOP questions and their properties
// You can adjust character limits here
const SOP_QUESTIONS = [
  { id: "q1", label: "What motivated you to pursue higher education in your chosen field of study?", charLimit: 1000 },
  { id: "q2", label: "How did your academic and personal experiences lead you to this specific program and university?", charLimit: 1500 },
  { id: "q3", label: "What are your short-term and long-term career goals, and how does this program align with them?", charLimit: 1000 },
  { id: "q4", label: "Can you describe any relevant research or projects you have been involved in and how they relate to your academic interests?", charLimit: 2000 },
  { id: "q5", label: "What unique qualities, skills, or experiences do you bring to the university and your chosen program?", charLimit: 1000 },
  { id: "q6", label: "How will you contribute to the academic and cultural diversity of the university community?", charLimit: 1000 },
  { id: "q7", label: "Are there any specific professors, research centers, or resources at the university that attracted you to the program?", charLimit: 800 },
  { id: "q8", label: "Have you overcome any challenges or obstacles in your academic journey, and how have they shaped your aspirations?", charLimit: 1500 },
  { id: "q9", label: "What are your specific areas of interest within your field of study, and how do you plan to explore them during your academic career?", charLimit: 1500 },
  { id: "q10", label: "Can you highlight any extracurricular activities, leadership roles, or volunteer experiences that demonstrate your commitment to your chosen field or showcase your leadership skills?", charLimit: 1500 },
  { id: "q11", label: "How do you see yourself contributing to the university's values, mission, or goals?", charLimit: 1000 },
  { id: "q12", label: "Are there any relevant accomplishments, awards, or publications that you would like to mention?", charLimit: 1000 },
  { id: "q13", label: "What do you hope to gain from this program, both academically and personally?", charLimit: 800 },
  { id: "q14", label: "How do you plan to use your education and knowledge to make a positive impact on society or your field?", charLimit: 1200 },
  { id: "q15", label: "Can you provide examples of your ability to work collaboratively with others or your adaptability in different environments?", charLimit: 1200 },
  { id: "q16", label: "Are there any specific courses or aspects of the program that you are particularly excited about?", charLimit: 800 },
  { id: "q17", label: "How do your academic and research interests align with current trends or challenges in your field?", charLimit: 1500 },
  { id: "q18", label: "Can you discuss any innovative ideas or projects you hope to pursue during your time at the university?", charLimit: 1500 },
  { id: "q19", label: "How do you plan to balance your academic responsibilities with any other commitments or obligations?", charLimit: 800 },
  { id: "q20", label: "Do you have any specific questions or concerns about the program or university that you would like to address in your SOP?", charLimit: 800 },
];

// Initialize form state with empty strings for all question IDs
const initialSopForm = SOP_QUESTIONS.reduce((acc, question) => {
  acc[question.id] = "";
  return acc;
}, {} as { [key: string]: string });

const SopQuestionnaire = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(initialSopForm);
  const [status, setStatus] = useState("");
  const [isExisting, setIsExisting] = useState(false); // To know if we should setDoc or updateDoc

  useEffect(() => {
    if (user) {
      loadSopResponses();
    }
  }, [user]);

  const loadSopResponses = async () => {
    if (!user || !user.uid) return;

    try {
      const docRef = doc(db, "users", user.uid, "profile", "sop_questionnaire");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setForm({ ...initialSopForm, ...docSnap.data() });
        setIsExisting(true);
      } else {
        setForm(initialSopForm);
        setIsExisting(false);
      }
    } catch (err) {
      console.error("Error loading SOP responses:", err);
      setStatus("❌ Failed to load previous responses.");
    }
  };

  const handleChange = (questionId: string, value: string) => {
    // Apply character limit
    const question = SOP_QUESTIONS.find(q => q.id === questionId);
    if (question && value.length > question.charLimit) {
      value = value.substring(0, question.charLimit);
    }
    setForm((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      setStatus("❌ User not authenticated.");
      return;
    }

    setStatus("Saving responses...");
    try {
      const docRef = doc(db, "users", user.uid, "profile", "sop_questionnaire");
      if (isExisting) {
        await updateDoc(docRef, form);
      } else {
        await setDoc(docRef, form);
      }
      setStatus("✅ Responses saved successfully!");
      setIsExisting(true); // Mark as existing for future updates
    } catch (err) {
      console.error("Error saving SOP responses:", err);
      setStatus("❌ Failed to save responses.");
    }
  };

  // --- Progress Bar Calculation ---
  const totalQuestions = SOP_QUESTIONS.length;
  const answeredQuestions = Object.entries(form).filter(([_key, value]) => { // Added _key to mark as unused
    // A question is "answered" if its string value is not empty after trimming
    return typeof value === 'string' && value.trim() !== '';
  }).length;

  const completionPercentage = totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100);
  const missingQuestions = totalQuestions - answeredQuestions;
  // --- End Progress Bar Calculation ---

  return (
    <div className="p-6 max-w-4xl mx-auto relative dark:bg-darkgray rounded-xl shadow-md"> {/* Added dark mode background and shadow */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
        <div className="mb-4 md:mb-0 flex-1">
          <h2 className="text-2xl font-bold mb-2 text-dark dark:text-white">✍️ SOP Questionnaire</h2>
          <Progress
            percent={completionPercentage}
            status={completionPercentage === 100 ? 'success' : 'active'}
            format={(percent) => `${answeredQuestions}/${totalQuestions} answered (${percent.toFixed(0)}%)`}
            strokeColor={{
              from: '#374151', // Dark grey/blue
              to: '#FBCC32',   // Yellow/gold
            }}
          />
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400"> {/* Dark mode text color */}
            ({missingQuestions} Questions Still Unanswered)
          </p>
        </div>
        <div className="md:ml-auto"> {/* Aligns the save button to the right on desktop */}
            <button
                onClick={handleSave}
                className="bg-primary hover:bg-yellow-500 text-white px-6 py-2 rounded shadow transition dark:bg-primary-dark dark:hover:bg-yellow-600" // Dark mode for button
            >
                Save Responses
            </button>
        </div>
      </div>

      {status && <p className="mt-4 text-sm text-blue-600 text-center dark:text-blue-400">{status}</p>} {/* Dark mode for status text */}

      <div className="space-y-6 mt-6">
        {SOP_QUESTIONS.map((q) => (
          <div key={q.id} className="border p-4 rounded-xl bg-white shadow-sm dark:bg-darkgray-700 dark:border-gray-700"> {/* Dark mode for card */}
            <label htmlFor={q.id} className="block text-md font-medium text-gray-700 mb-2 dark:text-white"> {/* Dark mode for label */}
              {SOP_QUESTIONS.findIndex(item => item.id === q.id) + 1}. {q.label}
              <span className="text-sm text-gray-500 ml-2 dark:text-gray-400">({(form[q.id] || "").length}/{q.charLimit})</span> {/* Dark mode for character count */}
            </label>
            <textarea
              id={q.id}
              value={form[q.id]}
              onChange={(e) => handleChange(q.id, e.target.value)}
              rows={Math.max(5, Math.ceil(q.charLimit / 150))} // Dynamic rows based on char limit for better UX
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 custom-textarea dark:bg-darkgray-800 dark:border-gray-600 dark:text-white" // Dark mode for textarea
              placeholder="Type your response here..."
              maxLength={q.charLimit} // Enforce max length at input level
            />
          </div>
        ))}
      </div>

      <div className="mt-8 text-right">
        <button onClick={handleSave} className="bg-primary hover:bg-yellow-500 text-white px-6 py-2 rounded shadow dark:bg-primary-dark dark:hover:bg-yellow-600"> {/* Dark mode for button */}
          Save Responses
        </button>
      </div>
    </div>
  );
};

export default SopQuestionnaire;