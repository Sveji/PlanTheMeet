import { useContext } from 'react'
import Friend from '../../components/Friend/Friend'
import './chat.less'
import { DataContext } from '../../context/DataContext'
import DuplicateBox from '../../components/DuplicateBox/DuplicateBox'

const Chat = () => {
    // Gets global data from the context
    const { getFriendColor } = useContext(DataContext)



    return (
        <section className="section-chat">
            <DuplicateBox>
                <div className="chats-container">
                    {
                        Array.from({ length: 25 }, _ => null).map((chat, i) => (
                            <Friend key={i} color={getFriendColor(i)} />
                        ))
                    }
                </div>
            </DuplicateBox>
        </section>
    )
}

export default Chat