import { useContext, useEffect, useState } from "react"
import './event.less'
import { DataContext } from "../../context/DataContext"
import DuplicateBox from "../../components/DuplicateBox/DuplicateBox"
import Friend from "../../components/Friend/Friend"
import Search from "../../components/Search/Search"
import "../MyCalendar/myCalendar.less"


const AddEvent = () => {
    // Gets global data from the context
    const { getSeason } = useContext(DataContext)
    const { getFriendColor } = useContext(DataContext)




    const [date, setDate] = useState(new Date())
    const [season, setSeason] = useState('winter')
    const [search, setSearch] = useState("")



    // Sets the season on init
    useEffect(() => {
        const currSeason = getSeason(date.getMonth())
        setSeason(currSeason)
    }, [date])

    return (
        <section className={`section-add-event ${season}`}>
            <div className="add">
                <div className="title-box">
                    <h2>Add an event</h2>
                    <div className="date-box">
                        {date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`}.{date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`}.{date.getFullYear()}
                    </div>
                </div>
                <div className="form-box">
                    <div className="form-container">
                        <div className="form">
                            <p className="details">Details</p>
                            <div className="form-inputs">
                                <label htmlFor="">Title</label>
                                {/* <DublicateBox> */}
                                <input className="inputs" type="text" />
                                {/* </DublicateBox> */}


                            </div>
                            <div className="form-inputs">
                                <label htmlFor="">Description</label>
                                <textarea name="" id="" className="inputs description"></textarea>
                            </div>
                            <div className="info">
                                <div className="info-inputs">
                                    <label htmlFor="">Location</label>
                                    <input type="text" className="inputs" />
                                </div>

                                <div className="info-inputs">
                                    <label htmlFor="">Time</label>
                                    <input type="time" className="inputs" />
                                </div>
                            </div>
                        </div>


                        <div className="participants">
                            <p className="title">Participants</p>
                            <div className="friends">
                                {
                                    Array.from({ length: 3 }, _ => null).map((friend, i) => (
                                        <Friend
                                            key={i}
                                            crossIcon
                                            color={getFriendColor(i)} />
                                    ))
                                }

                            </div>
                            <Search
                                placeholder="Add participants"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-btn">
                        <h4>Add to calendar</h4>
                    </div>
                </div>



            </div >

        </section >
    )
}

export default AddEvent