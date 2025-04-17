import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import './events.less'
import EventCard from '../../../../components/EventCard/EventCard.jsx'
const Events = () => {


    return (
        <div className='events-date'>
            <h3>16 April</h3>
            <div className='events-bar'>
                <FaArrowLeft className='arrow-icon' />
                <div className="events">
                    <EventCard />
                </div>
                <FaArrowRight className='arrow-icon' />
            </div>
        </div>
    )
}

export default Events