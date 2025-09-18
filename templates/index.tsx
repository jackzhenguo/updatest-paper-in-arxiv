import React from 'react';
import ReactDOM from 'react-dom/client';  // Import createRoot
import { BrowserRouter } from 'react-router-dom';  // BrowserRouter for routing
import App from './App';  // Import the App component
import { AuthProvider } from './AuthContext';  // Import the AuthProvider
import './tailwind.css';  // Import your styles (if you're using Tailwind CSS)

const rootElement = document.getElementById('root') as HTMLElement;

// Create the root and render the app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Wrap the App with BrowserRouter for routing */}
      <AuthProvider> {/* Wrap the App with AuthProvider to provide auth context */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
