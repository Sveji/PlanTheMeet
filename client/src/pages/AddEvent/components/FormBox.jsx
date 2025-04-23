import { DataContext } from "../../../context/DataContext"
import Participants from "./Participants"
import { useContext, useState } from "react"
import Form from './Form.jsx'


// const FormBox = ({ date }) => {
// // Gets global data from the context
// const { socketSend, selectedFriends } = useContext(DataContext)



// // Holds the state for the form
// const [title, setTitle] = useState("")
// const [description, setDescription] = useState("")
// const [location, setLocation] = useState("")
// const [time, setTime] = useState("")



// // Sends a request through the web socket server to create an event
// const handleSubmit = async () => {
//     const participants = selectedFriends.map(friend => friend.id)
//     const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`}-${date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`}`

//     socketSend({
//         type: 'addEvent',
//         title,
//         description,
//         date: formattedDate,
//         time,
//         location,
//         participants
//     })
// }



const FormBox = ({
    summary,
    setSummary,
    description,
    setDescription,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
    handleSubmit }) => {


    return (
        <div className="form-box">
            <div className="form-container">
                <Form
                    summary={summary}
                    setSummary={setSummary}
                    description={description}
                    setDescription={setDescription}

                    startDate={startDate}
                    setStartDate={setStartDate}
                    startTime={startTime}
                    setStartTime={setStartTime}

                    endDate={endDate}
                    setEndDate={setEndDate}
                    endTime={endTime}
                    setEndTime={setEndTime}

                    handleSubmit={handleSubmit}
                />

                {/* <div className="form-inputs">
                    <label htmlFor="">Description</label>
                    <textarea
                        className="inputs description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div> */}


                {/* <div className="info-inputs">
                        <label htmlFor="">Location</label>
                        <input
                            type="text"
                            className="inputs"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div> */}



                {/* <div className="info-inputs">
                        <label htmlFor="">Time</label>
                        <input
                            type="time"
                            className="inputs"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div> */}
                {/* <div className="info-inputs">
                        <label htmlFor="">Date</label>
                        <input
                            type="date"
                            className="inputs"
                            value={startDate}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div> */}

                {/* <div className="info-inputs">
                        <label htmlFor="">Time</label>
                        <input
                            type="time"
                            className="inputs"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div> */}
                {/* <div className="info-inputs">
                        <label htmlFor="">Date</label>
                        <input
                            type="date"
                            className="inputs"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div> */}

                {/* </div> */}

                <Participants />

            </div>
            <div className="form-btn"
                onClick={handleSubmit}>
                <h4>Add to calendar</h4>
            </div>
        </div >
    )
}

export default FormBox