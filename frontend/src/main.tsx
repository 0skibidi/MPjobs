import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App.tsx'
import './index.css'

// Global error handler to prevent browser alert popups
window.addEventListener('error', (event) => {
  // Prevent default browser error popups
  event.preventDefault();
  
  // Log to console instead
  console.error('Uncaught error:', event.error);
  
  return true; // Prevent default handling
});

// Also handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Prevent default browser error popups
  event.preventDefault();
  
  // Log to console instead
  console.error('Unhandled promise rejection:', event.reason);
  
  return true; // Prevent default handling
});

const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  )
} 