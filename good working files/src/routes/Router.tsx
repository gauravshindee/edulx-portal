// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import ProtectedRoute from "src/routes/ProtectedRoute";
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from 'src/layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ***Pages**** */
const Dashboard = Loadable(lazy(() => import('../views/dashboards/Dashboard')));
const Typography = Loadable(lazy(() => import('../views/typography/Typography')));
const Table = Loadable(lazy(() => import('../views/tables/Table')));
const Form = Loadable(lazy(() => import('../views/forms/Form')));
const Shadow = Loadable(lazy(() => import('../views/shadows/Shadow')));
const Solar = Loadable(lazy(() => import('../views/icons/Solar')));
const Login = Loadable(lazy(() => import('../views/auth/login/Login')));
const Register = Loadable(lazy(() => import('../views/auth/register/Register')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')));
const Error = Loadable(lazy(() => import('../views/auth/error/Error')));

/* ✅ New: Student Features */
const DocumentUpload = Loadable(lazy(() => import('../views/student/DocumentUpload')));
const MyProfile = Loadable(lazy(() => import('../views/student/MyProfile'))); // ✅ Import MyProfile
const SopQuestionnaire = Loadable(lazy(() => import('../views/student/SopQuestionnaire'))); // ✅ ADDED THIS LINE FOR SOP QUESTIONNAIRE

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      {
        path: '/',
        exact: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/documents',
        exact: true,
        element: (
          <ProtectedRoute>
            <DocumentUpload />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/my-profile', // ✅ Route for My Profile page
        exact: true,
        element: (
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/student/SopQuestionnaire', // ✅ ADDED THIS NEW ROUTE FOR SOP QUESTIONNAIRE
        exact: true,
        element: (
          <ProtectedRoute>
            <SopQuestionnaire /> {/* ✅ RENDER THE SOP QUESTIONNAIRE COMPONENT */}
          </ProtectedRoute>
        ),
      },
      {
        path: '/ui/typography',
        exact: true,
        element: (
          <ProtectedRoute>
            <Typography />
          </ProtectedRoute>
        ),
      },
      {
        path: '/ui/table',
        exact: true,
        element: (
          <ProtectedRoute>
            <Table />
          </ProtectedRoute>
        ),
      },
      {
        path: '/ui/form',
        exact: true,
        element: (
          <ProtectedRoute>
            <Form />
          </ProtectedRoute>
        ),
      },
      {
        path: '/ui/shadow',
        exact: true,
        element: (
          <ProtectedRoute>
            <Shadow />
          </ProtectedRoute>
        ),
      },
      {
        path: '/icons/solar',
        exact: true,
        element: (
          <ProtectedRoute>
            <Solar />
          </ProtectedRoute>
        ),
      },
      {
        path: '/sample-page',
        exact: true,
        element: (
          <ProtectedRoute>
            <SamplePage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/register', element: <Register /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router, { basename: '/portal' });
export default router;