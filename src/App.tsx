// src/App.tsx
import { RouterProvider } from "react-router";
import { Flowbite, ThemeModeScript } from 'flowbite-react';
import flowbiteCustomTheme from './utils/theme/custom-theme'; // This is your Flowbite theme
import muiCustomTheme from './utils/theme/mui-custom-theme'; // This is your NEW Material-UI theme
import router from "./routes/Router";
import 'antd/dist/reset.css';

import { ConfigProvider, App as AntdApp } from 'antd';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'; // Import Material-UI ThemeProvider
import CssBaseline from '@mui/material/CssBaseline'; // Optional: for consistent baseline CSS

function App() {
  return (
    <>
      <ThemeModeScript />
      {/* Flowbite ThemeProvider */}
      <Flowbite theme={{ theme: flowbiteCustomTheme }}>
        {/* Ant Design's ConfigProvider (if still using Ant Design components) */}
        <ConfigProvider>
          <AntdApp>
            {/* Material-UI ThemeProvider for MUI components */}
            <MuiThemeProvider theme={muiCustomTheme}>
              <CssBaseline /> {/* Optional: Material-UI baseline CSS */}
              <RouterProvider router={router} />
            </MuiThemeProvider>
          </AntdApp>
        </ConfigProvider>
      </Flowbite>
    </>
  );
}

export default App;