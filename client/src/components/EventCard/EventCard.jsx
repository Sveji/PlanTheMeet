import './eventsCard.less';
import IMG from '../../img/jake.jpg';

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

                <div className="button-duplicate"></div>
                <div className='button'><h4>Add to calendar</h4></div>
            </div>
        </div>
    );
};

export default EventCard;
