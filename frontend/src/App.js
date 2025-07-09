import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Sidebar from './components/sidebar';
import Uploadexcel from './pages/Uploadexcel';

function App() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1 }}>
        <Routes>
          <Route path="/" element={<Uploadexcel />} /> 
        </Routes>
      </div>
    </div>
  );
}

export default App;
