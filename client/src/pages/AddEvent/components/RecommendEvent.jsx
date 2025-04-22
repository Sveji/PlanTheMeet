import IMG from '../../../img/jake.jpg'

const RecommendEvent = ({ title = "Sofia SUMMER Fest", info = " info" }) => {
    return (
        <div className="recommended-event">
            <img src={IMG} className="img" />

            <div className="info-box">
                <div className="text">
                    <h3 className="title">
                        {title}
                    </h3>
                    <p>{info}</p>
                </div>

                <button className="btn">Add to calendar</button>

            </div>
        </div>
    )
}

export default RecommendEvent