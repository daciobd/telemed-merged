import { Routes, Route } from 'react-router-dom';
import PHRDoc24 from '@/views/phr/PHRIndex';

export default function PHRRoutes() {
  return (
    <Routes>
      <Route path='/phr' element={<PHRDoc24/>}/>
      <Route path='/phr/:id' element={<PHRDoc24/>}/>
    </Routes>
  );
}