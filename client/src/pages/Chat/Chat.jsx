import { useContext, useState } from 'react'
import Friend from '../../components/Friend/Friend'
import './chat.less'
import { DataContext } from '../../context/DataContext'
import DuplicateBox from '../../components/DuplicateBox/DuplicateBox'
import pfp from '../../img/pfp.png'
import { LuSendHorizontal } from "react-icons/lu";

const Chat = () => {
    // Gets global data from the context
    const { getFriendColor } = useContext(DataContext)



    // Holds the placeholder messages
    const messages = [
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'in'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'out'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'in'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'out'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'in'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'out'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'in'
        },
        {
            message: 'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Odit, culpa commodi accusantium reiciendis deserunt, modi corporis voluptate iusto consequuntur quaerat dolorem nam dolores adipisci vitae ea nisi voluptatem maxime ipsum!',
            type: 'out'
        },
    ]



    // Holds the message being typed
    const [typingMessage, setTypingMessage] = useState("")



    return (
        <section className="section-chat">
            <DuplicateBox className='chats-duplicate'>
                <div className="chats-container">
                    {
                        Array.from({ length: 25 }, _ => null).map((chat, i) => (
                            <Friend key={i} color={getFriendColor(i)} />
                        ))
                    }
                </div>
            </DuplicateBox>

            <div className="chat-box">
                <div className="title-box">
                    <img src={pfp} alt="User Profile Pic" className='pfp' />
                    <div className="info-box">
                        <p className="name">Alek Palek</p>
                        <p className="email">alekPalek69bgXX@gmail.com</p>
                    </div>
                </div>

                <div className="message-area">
                    <div className="message-list">
                        {
                            messages.map((message, i) => (
                                <div key={i} className={`message ${message.type}`}>{message.message}</div>
                            ))
                        }
                    </div>
                    <form className='send-form'>
                        <DuplicateBox className='input'>
                            <input
                                placeholder='Type message...'
                                value={typingMessage}
                                onChange={(e) => setTypingMessage(e.target.value)}
                            />
                        </DuplicateBox>
                        <DuplicateBox className='btn-duplicate'>
                            <button type='submit' className='send-btn'>
                                <LuSendHorizontal className='icon' />
                            </button>
                        </DuplicateBox>
                    </form>
                </div>
            </div>
        </section>
    )
}

export default Chat