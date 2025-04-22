import './eventsCard.less';
// import '../../pages/MyCalendar/myCalendar.less'
// import '../../globalStyling/components.less'
import IMG from '../../img/jake.jpg';
import DuplicateBox from '../DuplicateBox/DuplicateBox';

const EventCard = ({ color = 'orange', event, info = 'info', image = IMG, date = '27.04.2025' }) => {
    return (
        <div className={`card `}>
            <div className={`heading ${color}`}>
                <h4>{event}</h4>
            </div>
            <img src={image} className='img' />
            <div className='description'>
                <p className='text'>
                    {info}
                </p>
            </div>
            <div className='info'>
                <div><h4>{date}</h4></div>


                <DuplicateBox className="duplicate-btn">
                    <button className="btn">Add to calendar</button>
                </DuplicateBox>

            </div>
        </div>
    );
};

export default EventCard;
