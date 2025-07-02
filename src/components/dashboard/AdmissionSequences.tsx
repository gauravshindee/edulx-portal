import { useState } from "react";
import { Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

// Data structure for an admission timeline step
interface AdmissionStep {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
}

// --- Admission Process Steps Data (A more generic "Studying Abroad" workflow) ---
const studyAbroadProcessTimeline: AdmissionStep[] = [
  { title: "University Research", description: "Shortlist programs and universities based on criteria.", status: "completed" },
  { title: "Standardized Tests", description: "Prepare for and take GRE, GMAT, IELTS/TOEFL.", status: "completed" },
  { title: "SOP & LORs", description: "Draft Statement of Purpose, request Letters of Recommendation.", status: "in-progress" },
  { title: "Resume/CV Update", description: "Update academic and professional resume/curriculum vitae.", status: "in-progress" },
  { title: "Application Submission", description: "Submit online applications and pay application fees.", status: "pending" },
  { title: "Interview Prep", description: "Prepare for and attend university interviews if required.", status: "pending" },
  { title: "Financial Documents", description: "Arrange and prepare bank statements, sponsorship letters.", status: "pending" },
  { title: "Decision & Acceptance", description: "Receive admission decisions and accept best offers.", status: "pending" },
  { title: "Visa Application", description: "Begin student visa application process.", status: "pending" },
  { title: "Travel & Orientation", "description": "Book flights, arrange accommodation, attend orientation.", status: "pending" },
];

// --- Document Types from src/views/student/DocumentUpload.tsx ---
// This is the definitive list of all document types
export const DOCUMENT_TYPES = [
  "Passport Size Photo",
  "Passport PDF",
  "CV / Resume",
  "10th/12th Certificates",
  "Degree & Transcripts",
  "APS Certificate",
  "Language Certificate",
  "LOR - Company",
  "LOR - Professor",
  "SOP Questionnaire",
  "Research Work",
  "Project Work",
  "Internship Letters",
  "Extra Curriculars",
  "Entrance Exam Certificates",
  "Bachelors / Masters Course Modules",
  "Grading System PDF",
  "Other Documents"
];

// --- Document Categories for the dropdown ---
// These categories now strictly use documents from DOCUMENT_TYPES
type DocumentCategoryKey = "personal" | "academic" | "extracurricular";

const personalDocuments: string[] = [
  "Passport Size Photo",
  "Passport PDF",
  "CV / Resume",
];

const academicDocuments: string[] = [
  "10th/12th Certificates",
  "Degree & Transcripts",
  "APS Certificate",
  "Language Certificate",
  "LOR - Company",
  "LOR - Professor",
  "SOP Questionnaire",
  "Entrance Exam Certificates",
  "Bachelors / Masters Course Modules",
  "Grading System PDF",
];

const extracurricularDocuments: string[] = [
  "Research Work",
  "Project Work",
  "Internship Letters",
  "Extra Curriculars",
  "Other Documents"
];

const allDocumentCategories: Record<DocumentCategoryKey, string[]> = {
  personal: personalDocuments,
  academic: academicDocuments,
  extracurricular: extracurricularDocuments
};

// --- MOCK UPLOADED DOCUMENTS DATA ---
// This object simulates the actual uploaded status of documents based on image_e29162.png
// ONLY includes documents from the provided DOCUMENT_TYPES list.
// If a document from DOCUMENT_TYPES is not listed here, it's considered pending.
const mockUploadedDocumentsStatus: Record<string, boolean> = {
  "Passport Size Photo": true,  // From image_e29162.png
  "Passport PDF": true,       // From image_e29162.png
  "CV / Resume": true,        // From image_e29162.png
  "10th/12th Certificates": true, // From image_e29162.png
  "Degree & Transcripts": true,  // From image_e29162.png
  "APS Certificate": true,    // From image_e29162.png
  "Language Certificate": true,  // From image_e29162.png
  "LOR - Company": true,      // From image_e29162.png
  "LOR - Professor": true,    // From image_e29162.png
  "SOP Questionnaire": true,  // From image_e29162.png
  "Research Work": true,      // From image_e29162.png
  "Project Work": true,       // From image_e29162.png
  // The rest are assumed false (pending) if not explicitly in image_e29162.png or mentioned
  "Internship Letters": false,
  "Extra Curriculars": false,
  "Entrance Exam Certificates": false,
  "Bachelors / Masters Course Modules": false,
  "Grading System PDF": false,
  "Other Documents": false
};

const AdmissionSequences = () => {
  const [selectedDocCategory, setSelectedDocCategory] = useState<DocumentCategoryKey>("personal");

  // --- Document Submission Graph Data Logic ---
  const getDocumentSubmissionGraphData = (category: DocumentCategoryKey): { categories: string[]; colors: string[]; displayLabels: string[] } => {
    const documentsInCatergory = allDocumentCategories[category];
    const categories: string[] = []; // Full names for tooltips
    const colors: string[] = [];
    const displayLabels: string[] = []; // Shortened names for displaying on bars

    documentsInCatergory.forEach(docType => {
      // Ensure the document type is actually in the DOCUMENT_TYPES list before processing
      if (!DOCUMENT_TYPES.includes(docType)) {
        console.warn(`Document type "${docType}" found in category but not in DOCUMENT_TYPES. Skipping.`);
        return; // Skip if not a valid document type
      }

      categories.push(docType); // Keep full name for tooltip

      let shortenedLabel = docType;
      // Define shortened labels for display on bars
      if (docType === "Passport Size Photo") shortenedLabel = "Passport Size";
      else if (docType === "Passport PDF") shortenedLabel = "Passport PDF";
      else if (docType === "CV / Resume") shortenedLabel = "CV /";
      else if (docType === "10th/12th Certificates") shortenedLabel = "10th/12th Certs";
      else if (docType === "Degree & Transcripts") shortenedLabel = "Degree & Transcripts";
      else if (docType === "APS Certificate") shortenedLabel = "APS Cert.";
      else if (docType === "Language Certificate") shortenedLabel = "Lang. Cert.";
      else if (docType === "LOR - Company") shortenedLabel = "LOR - Company";
      else if (docType === "LOR - Professor") shortenedLabel = "LOR - Prof.";
      else if (docType === "SOP Questionnaire") shortenedLabel = "SOP Quest.";
      else if (docType === "Research Work") shortenedLabel = "Research Work";
      else if (docType === "Project Work") shortenedLabel = "Project Work";
      else if (docType === "Internship Letters") shortenedLabel = "Internship Let.";
      else if (docType === "Extra Curriculars") shortenedLabel = "Extra Curr.";
      else if (docType === "Entrance Exam Certificates") shortenedLabel = "Entrance Exam Certs";
      else if (docType === "Bachelors / Masters Course Modules") shortenedLabel = "Course Modules";
      else if (docType === "Grading System PDF") shortenedLabel = "Grading PDF";
      else if (docType === "Other Documents") shortenedLabel = "Other Docs";

      displayLabels.push(shortenedLabel);

      // Determine status based on mockUploadedDocumentsStatus
      const isSubmitted = mockUploadedDocumentsStatus[docType] || false; // Default to false if not found
      colors.push(isSubmitted ? 'var(--color-primary)' : 'var(--color-primary-dark)'); // Yellow for submitted, dark for pending
    });

    return { categories, colors, displayLabels };
  };

  const { categories: docCategories, colors: docColors, displayLabels: docDisplayLabels } = getDocumentSubmissionGraphData(selectedDocCategory);

  // ApexCharts options for the Document Submission Bar Chart
  const optionsDocumentChart: ApexOptions = {
    chart: {
      type: 'bar',
      height: 180, // Height to accommodate short, fat bars
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    plotOptions: {
      bar: {
        horizontal: false, // Vertical bars
        columnWidth: '60%', // Wider bars
        borderRadius: 4,
        distributed: true, // Crucial for applying colors array to individual bars
        dataLabels: { // Properties here relate to positioning of data labels on the bar
          position: 'top', // Position property moved back here
        }
      },
    },
    // Top-level dataLabels to enable them and set their style for the series
    dataLabels: {
      enabled: true, // This correctly enables the data labels for the series
      offsetY: -10, // Adjust vertical position
      formatter: function (_val: number, opts: any) { // Formatter
        // Display the shortened label for each bar from docDisplayLabels
        // Use opts.dataPointIndex to get the correct label
        return docDisplayLabels[opts.dataPointIndex];
      },
      style: { // Style
        colors: ['var(--color-bodytext)'],
        fontSize: '11px',
        fontWeight: 500,
      },
      textAnchor: 'middle', // Text anchor
      dropShadow: { // Drop shadow
        enabled: true,
        top: 1, left: 1, blur: 1, opacity: 0.3
      }
    },
    stroke: { show: false },
    xaxis: {
      categories: docCategories, // Full names for tooltips
      labels: {
        show: false, // Hide X-axis labels for a cleaner look
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      show: false, // Hide Y-axis labels
      max: 100 // Value is always 100 for a bar
    },
    fill: {
      opacity: 1,
      colors: docColors // Pass the array of colors for each bar
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (_val: number, opts: any) {
          const color = docColors[opts.dataPointIndex];
          return color === 'var(--color-primary)' ? "Submitted" : "Pending";
        },
        title: {
            formatter: (_seriesName: string) => '' // Hide series name
        }
      },
      x: {
        formatter: function (val: string | number): string {
          return String(val);
        }
      },
      theme: "dark",
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      markers: {
        width: 12,
        height: 12,
        radius: 6,
        fillColors: ['var(--color-primary)', 'var(--color-primary-dark)']
      },
      itemMargin: {
        horizontal: 8,
        vertical: 0
      },
      onItemClick: { toggleDataSeries: false },
      onItemHover: { highlightDataSeries: false },
      customLegendItems: ['Submitted', 'Pending'], // Manually define legend items
      labels: {
        colors: ['var(--color-primary)', 'var(--color-primary-dark)']
      },
    },
    grid: { show: false },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } }
    }
  };

  // The series data remains simple: one series with 100 for each bar
  const graphSeries = [{
      name: 'Document Status',
      data: docCategories.map(() => 100)
  }];

  const progressBarWidth = (
    studyAbroadProcessTimeline.filter(step => step.status === 'completed').length /
    studyAbroadProcessTimeline.length
  ) * 100;

  return (
    <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words">
      {/* Document Submission Status Section */}
      <div className="flex justify-between items-center mb-4">
        <h5 className="card-title text-dark dark:text-white">Document Submission Status</h5>
        <Select
          id="docCategory"
          className="select-md dark:bg-darkgray-700 dark:border-gray-600 dark:text-white"
          value={selectedDocCategory}
          onChange={(e) => setSelectedDocCategory(e.target.value as DocumentCategoryKey)}
          required
        >
          <option value="personal" className="dark:bg-darkgray-700 dark:text-white">Personal Documents</option>
          <option value="academic" className="dark:bg-darkgray-700 dark:text-white">Academic Documents</option>
          <option value="extracurricular" className="dark:bg-darkgray-700 dark:text-white">Extracurricular Documents</option>
        </Select>
      </div>

      <div className="w-full mb-6">
        <Chart
          options={{
            ...optionsDocumentChart,
            xaxis: {
              ...optionsDocumentChart.xaxis,
              categories: docCategories,
            },
          }}
          series={graphSeries}
          type="bar"
          height={180}
        />
        <p className="text-xs text-gray-500 text-center mt-2 dark:text-gray-400">
            Submitted documents are in yellow, pending in dark, please submit in Document Upload section.
        </p>
      </div>

      {/* Admission Process Steps Section (Horizontal Timeline) */}
      <h5 className="card-title text-dark dark:text-white mb-4">Admission Process Steps</h5>
      <div className="relative overflow-x-auto py-0 custom-scrollbar-horizontal -mx-6">
        {studyAbroadProcessTimeline.length > 0 ? (
          <div className="flex flex-row justify-start min-w-max h-[140px] px-6">
            {studyAbroadProcessTimeline.map((step, index) => (
              <div
                key={index}
                className={`flex-none w-64 p-4 pb-2 flex flex-col items-start relative z-10
                          ${index > 0 ? '-ml-px' : ''}
                          ${step.status === 'completed' ? 'bg-green-50 dark:bg-green-900' :
                            step.status === 'in-progress' ? 'bg-yellow-50 dark:bg-yellow-900' :
                            'bg-gray-50 dark:bg-gray-700'} `}
                style={{
                    borderTopLeftRadius: index === 0 ? '0.5rem' : '0',
                    borderBottomLeftRadius: index === 0 ? '0.5rem' : '0',
                    borderTopRightRadius: index === studyAbroadProcessTimeline.length -1 ? '0.5rem' : '0',
                    borderBottomRightRadius: index === studyAbroadProcessTimeline.length -1 ? '0.5rem' : '0',
                    borderTop: '1px solid var(--color-border-light)',
                    borderBottom: '1px solid var(--color-border-light)',
                    borderLeft: index === 0 ? '1px solid var(--color-border-light)' : 'none',
                    borderRight: '1px solid var(--color-border-light)',
                    boxSizing: 'border-box'
                }}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2
                                  ${step.status === 'completed' ? 'bg-green-200 text-green-700 dark:bg-green-600 dark:text-white' :
                                    step.status === 'in-progress' ? 'bg-yellow-200 text-yellow-700 dark:bg-yellow-600 dark:text-white' :
                                    'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-200'}`}>
                    <Icon icon={step.status === 'completed' ? 'ic:round-check' : 'ic:round-circle'} height={16} />
                  </div>
                  <h6 className="text-dark dark:text-white font-semibold text-sm whitespace-nowrap">{step.title}</h6>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2 text-left">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 px-6 dark:text-gray-400">
            No admission process steps available.
          </div>
        )}

        {/* Horizontal Progress Bar for Admission Steps */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 relative overflow-hidden z-0 px-6">
            <div className="h-full bg-primary rounded-full absolute top-0 left-0" style={{ width: `${progressBarWidth}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionSequences;