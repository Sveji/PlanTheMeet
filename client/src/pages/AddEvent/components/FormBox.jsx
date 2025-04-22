import { DataContext } from "../../../context/DataContext"
import Participants from "./Participants"
import { useContext, useState } from "react"

const FormBox = ({ date }) => {
    // Gets global data from the context
    const { socketSend, selectedFriends } = useContext(DataContext)



    // Holds the state for the form
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [location, setLocation] = useState("")
    const [time, setTime] = useState("")



    // Sends a request through the web socket server to create an event
    const handleSubmit = async () => {
        const participants = selectedFriends.map(friend => friend.id)
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`}-${date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`}`

        socketSend({
            type: 'addEvent',
            title,
            description,
            date: formattedDate,
            time,
            location,
            participants
        })
    }



    return (
        <div className="form-box">
            <div className="form-container">
                <div className="form">
                    <p className="details">Details</p>
                    <div className="form-inputs">
                        <label htmlFor="">Title</label>
                        <input
                            className="inputs"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="form-inputs">
                        <label htmlFor="">Description</label>
                        <textarea 
                            className="inputs description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    
                    <div className="info">
                        <div className="info-inputs">
                            <label htmlFor="">Location</label>
                            <input
                                type="text"
                                className="inputs" 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        <div className="info-inputs">
                            <label htmlFor="">Time</label>
                            <input
                                type="time"
                                className="inputs"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Participants />

            </div>
            <div className="form-btn">
                <button onClick={handleSubmit}><h4>Add to calendar</h4></button>
            </div>
        </div>
    )
}

export default FormBox