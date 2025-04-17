import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import './events.less'
import EventCard from '../../../../components/EventCard/EventCard.jsx'
const Events = ({ date = '16 April' }) => {


    const getColor = (index) => {
        switch (index % 6) {
            case 0: return 'pink'
            case 1: return 'green'
            case 2: return 'blue'
            case 3: return 'purple'
            case 4: return 'red'
            case 5: return 'orange'
        }
    }

    return (
        <div className='events-date'>
            <h3>{date}</h3>
            <div className='events-bar'>
                <FaArrowLeft className='arrow-icon' />
                <div className="events-list">
                    {
                        Array.from({ length: 4 }, _ => null).map((card, i) => (
                            < EventCard
                                key={i}
                                event='TUESFest'
                                color={getColor(i)}
                            />
                        ))
                    }
                </div>
                <FaArrowRight className='arrow-icon' />
            </div>
        </div>
    )
}

export default Events