import { BrowserRouter, Routes, Route } from "react-router-dom"
import DataProvider from "./context/DataContext"
import LayoutGrid from "./components/LayoutGrid/LayoutGrid"
import MyCalendar from "./pages/MyCalendar/MyCalendar"
import Register from "./pages/Register/Register"
import Login from "./pages/Login/Login"

function App() {

  return (
    <BrowserRouter>

      <DataProvider>

        <LayoutGrid type='screen' />

        <Routes>

          <Route path="/" element={<MyCalendar />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

        </Routes>

      </DataProvider>

    </BrowserRouter>
  )
}

export default App
