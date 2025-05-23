import { BrowserRouter, Routes, Route } from "react-router-dom"
import DataProvider from "./context/DataContext"
import LayoutGrid from "./components/LayoutGrid/LayoutGrid"
import MyCalendar from "./pages/MyCalendar/MyCalendar"
import Register from "./pages/Register/Register"
import Login from "./pages/Login/Login"
import AddEvent from "./pages/AddEvent/AddEvent"
import Nav from "./components/Nav/Nav"
import FriendsPage from "./pages/FriendsPage/FriendsPage"
import Chat from "./pages/Chat/Chat"
import AlekTupalek from "./AlekTupalek"
import { GoogleOAuthProvider } from '@react-oauth/google'
 

function App() {

  return (
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH2}>
    <BrowserRouter>

      <DataProvider>

        <LayoutGrid type='screen' />
        <Nav />

        <Routes>

          <Route path="/" element={<MyCalendar />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/add-event/:date" element={<AddEvent />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/chat" element={<Chat />} >
          
          </Route>
          <Route path="alek-tupalek" element={<AlekTupalek />} />

        </Routes>

      </DataProvider>

    </BrowserRouter>
</GoogleOAuthProvider>
  )
}

export default App
