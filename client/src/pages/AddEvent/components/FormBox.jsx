import Participants from "./Participants"
import Form from "./Form"

const FormBox = ({
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
    setEndTime,
    handleSubmit }) => {


    return (
        <div className="form-box">
            <div className="form-container">
                <Form
                    summary={summary}
                    setSummary={setSummary}
                    description={description}
                    setDescription={setDescription}

                    startDate={startDate}
                    setStartDate={setStartDate}
                    startTime={startTime}
                    setStartTime={setStartTime}

                    endDate={endDate}
                    setEndDate={setEndDate}
                    endTime={endTime}
                    setEndTime={setEndTime}

                    handleSubmit={handleSubmit} />


                <Participants />

            </div>
            <div className="form-btn"
                onClick={handleSubmit}>
                <h4>Add to calendar</h4>
            </div>
        </div>
    )
}

export default FormBox