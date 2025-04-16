import { BrowserRouter, Routes, Route } from "react-router-dom"
import DataProvider from "./context/DataContext"
import LayoutGrid from "./components/LayoutGrid/LayoutGrid"
import MyCalendar from "./pages/MyCalendar/MyCalendar"

function App() {

  return (
    <BrowserRouter>

      <DataProvider>

        <LayoutGrid type='screen' />

        <Routes>

          <Route path="/" element={<MyCalendar />} />

        </Routes>

      </DataProvider>

    </BrowserRouter>
  )
}

export default App
