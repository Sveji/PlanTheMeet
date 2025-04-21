import Participants from "./Participants"
import Form from "./Form"

const FormBox = () => {
    return (
        <div className="form-box">
            <div className="form-container">
                <Form />


                <Participants />

            </div>
            <div className="form-btn">
                <h4>Add to calendar</h4>
            </div>
        </div>
    )
}

export default FormBox