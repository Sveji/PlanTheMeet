import "../event.less"

const Form = ({
    summary,
    setSummary,
    description,
    setDescription,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endDate,
    setEndDate,
    endTime,
    setEndTime
}) => {

    return (<div className="form">
        <p className="details">Details</p>
        <div className="form-inputs">
            <label htmlFor="">Title</label>
            <input
                className="inputs"
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)} />



        </div>
        <div className="form-inputs">
            <label htmlFor="">Description</label>
            <textarea
                className="inputs description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            ></textarea>
        </div>
        <div className="info">
            <div className="info-inputs">
                <label htmlFor="">Date</label>
                <input
                    type="date"
                    className="inputs"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="info-inputs">
                <label htmlFor="">Time</label>
                <input
                    type="time"
                    className="inputs"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)} />
            </div>

            <div className="info-inputs">
                <label htmlFor="">Date</label>
                <input
                    type="date"
                    className="inputs"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="info-inputs">
                <label htmlFor="">Time</label>
                <input
                    type="time"
                    className="inputs"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)} />
            </div>
        </div>
    </div>)
}

export default Form