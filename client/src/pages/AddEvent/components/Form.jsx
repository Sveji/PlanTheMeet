import "../event.less"

const Form = () => {
    return (<div className="form">
        <p className="details">Details</p>
        <div className="form-inputs">
            <label htmlFor="">Title</label>
            <input className="inputs" type="text" />



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
    </div>)
}

export default Form