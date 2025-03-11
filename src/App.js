import React from 'react'
import { Routes ,Route} from 'react-router-dom'
import Home from './pages/Home';
import "./App.css"
import Navbar from './components/Common/Navbar';
function App() {
  return (
     <div  className="flex min-h-screen w-screen flex-col bg-richblack-900 font-inter">
      <Navbar/>
       <Routes>
         <Route path="/" element={<Home/>}/>
       </Routes>
     </div>
  );
}

export default App