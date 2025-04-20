import { MdArrowBackIos } from "react-icons/md";
import { Link } from "react-router-dom";
import DuplicateBox from "../../../../components/DuplicateBox/DuplicateBox";



const DayInfo = ({ ref, selected, setSelected }) => {
    // Formats a date object
    const formatDate = (date) => {
        return `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}.${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}.${date.getFullYear()}`
    }



    // Holds the placeholder holidays and events
    const holidays = [
        // {
        //     title: 'Easter',
        //     description: 'Официален празник'
        // },
        // {
        //     title: 'Great Monday',
        //     description: 'Официален празник'
        // }
    ]

    const events = [
        // {
        //     "id": "1ngiel3jk17c1g1in20fc3b1k6",
        //     "title": "izlizane s priqteli"
        // },
        // {
        //     "id": "1ngiel3jk17c1g1in20fc3b1k6",
        //     "title": "izlizane s priqteli"
        // },
        // {
        //     "id": "1ngiel3jk17c1g1in20fc3b1k6",
        //     "title": "izlizane s priqteli"
        // },
        // {
        //     "id": "1ngiel3jk17c1g1in20fc3b1k6",
        //     "title": "izlizane s priqteli"
        // },
    ]



    return (
        <section ref={ref} className="section-day">
            <div className="day-info-container">
                <div className="title-box">
                    <MdArrowBackIos onClick={() => setSelected(null)} className="icon" />
                    <h3 className="title">{formatDate(selected)}</h3>
                </div>
                <div className="info-box">
                    <DuplicateBox className="duplicate-btn">
                        <button className="btn">Add new event</button>
                    </DuplicateBox>

                    {
                        holidays &&
                        holidays.length > 0 &&
                        <div className="holidays-container">
                            {
                                holidays.map((holiday, i) => (
                                    <div key={i} className="holiday">
                                        <p className="title">{holiday.title}</p>
                                        <p className="description">{holiday.description}</p>
                                    </div>
                                ))
                            }
                        </div>
                    }

                    {
                        events &&
                        events.length > 0 &&
                        <div className="events-container">
                            <p className="title">Your events</p>

                            {
                                events.map((event, i) => (
                                    <div key={i} className="event">
                                        <p className="title">{event.title}</p>
                                        <Link className="details">See details</Link>
                                    </div>
                                ))
                            }
                        </div>
                    }

                    {
                        holidays.length == 0 && events.length == 0 &&
                        <p>You have nothing planned for today.</p>
                    }
                </div>
            </div>
        </section>
    )
}

export default DayInfo