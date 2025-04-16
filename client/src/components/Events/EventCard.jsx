import './events.less'
import IMG from '../../img/jake.jpg'

const EventCard = () => {

    return (
        // <section className='events'>
        <div className='card'>
            <div className='heading'>Sofia SUMMER fest</div>
            <img src={IMG} className='img' />
            <div className='description'>
                <p className='text'>Lorem ipsum dolor sit amet consectetur. Cras erat sed eu in purus. Ultrices fringilla id risus rhoncus sit arcu egestas. Pretium libero leo odio id vulputate mauris. Mollis lacus...</p>
            </div>
            <div className='info'>
                <div>27.04.2025</div>
                <div className='button'>Add to calendar</div>
            </div>

        </div>
        // </section>

    )
}

export default EventCard