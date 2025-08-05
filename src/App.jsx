"use client"

import React, { useState, useEffect, useRef } from "react"
import { Layout, Input, Button, Typography, message } from "antd"
import { PaperClipOutlined, SearchOutlined, AudioOutlined, SendOutlined } from "@ant-design/icons"
import axios from "axios"
import "./App.css"

const { Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

const API_BASE_URL = "http://35.154.102.246:5050"

function App() {
  const [message, setMessage] = useState("")
  const [conversations, setConversations] = useState([])
  const [chatRoomId, setChatRoomId] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [newResponse, setNewResponse] = useState(null) // Track new response for typewriter effect
  const [displayedResponse, setDisplayedResponse] = useState({})
  const [userId] = useState("26a783e4-ed70-4507-946b-d8918cb39cc3")
  const chatContainerRef = useRef(null)

  // Fetch user's chat rooms on component mount
  useEffect(() => {
    fetchChatRooms()
  }, [])

  // Scroll to bottom of chat when new messages or typewriter effect updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory, displayedResponse])

  // Typewriter effect for new assistant response
  useEffect(() => {
    if (newResponse?.request && newResponse?.response) {
      let currentText = ""
      const fullText = newResponse.response
      const request = newResponse.request
      let index = 0

      const type = () => {
        if (index < fullText.length) {
          const step = Math.min(4 + Math.floor(Math.random() * 2), fullText.length - index)
          currentText += fullText.slice(index, index + step)
          setDisplayedResponse((prev) => ({ ...prev, [request]: currentText }))
          index += step
          setTimeout(type, 50)
        } else {
          // Clear newResponse after typing is complete
          setNewResponse(null)
        }
      }
      type()
    }
  }, [newResponse])

  // Fetch chat rooms
  const fetchChatRooms = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/chat/user_id?id=${userId}`)
      const { chat_rooms } = response.data
      setConversations(chat_rooms.map(room => ({ id: room.id, title: room.title })))
    } catch (error) {
      console.error("Error fetching chat rooms:", error)
      message.error("Failed to fetch chat rooms")
    } finally {
      setLoading(false)
    }
  }

  // Fetch chat history
  const fetchChatHistory = async (roomId) => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/chat/message?id=${roomId}`)
      const history = response.data.chats || []
      setChatHistory(history)
      setChatRoomId(roomId)
      // Reset displayedResponse to show full responses without typewriter effect
      setDisplayedResponse(
        history.reduce((acc, chat) => {
          if (chat.response) {
            acc[chat.request] = chat.response
          }
          return acc
        }, {})
      )
      setNewResponse(null) // Ensure no typewriter effect for history
    } catch (error) {
      console.error("Error fetching chat history:", error)
      message.error("Failed to fetch chat history")
    } finally {
      setLoading(false)
    }
  }

  // Create a new chat room
  const createChatRoom = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${API_BASE_URL}/chat/room/create`, { user_id: userId })
      const newRoomId = response.data
      await fetchChatRooms()
      setChatRoomId(newRoomId)
      setChatHistory([])
      setDisplayedResponse({})
      setNewResponse(null)
    } catch (error) {
      console.error("Error creating chat room:", error)
      message.error("Failed to create chat room")
    } finally {
      setLoading(false)
    }
  }

  // Send a message and get response
  const handleSend = async () => {
    if (!message.trim()) return
    if (!chatRoomId) {
      message.warning("Please select or create a chat room")
      return
    }

    const newMessage = { request: message, response: null }
    setChatHistory([...chatHistory, newMessage])
    setMessage("")
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        chat_room_id: chatRoomId,
        request: message,
      })
      const requestId = response.data

      const responseData = await pollForResponse(requestId)
      const updatedMessage = { request: message, response: responseData.responce }
      setChatHistory(prev => [...prev.slice(0, -1), updatedMessage])
      setNewResponse(updatedMessage) // Trigger typewriter effect for new response
    } catch (error) {
      console.error("Error sending message:", error)
      message.error("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  // Poll for response
  const pollForResponse = async (requestId) => {
    const maxAttempts = 10
    const delay = 2000
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/get/responce?id=${requestId}`)
        if (response.status === 200 && response.data.responce) {
          return response.data
        }
      } catch (error) {
        console.error("Polling error:", error)
      }
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    throw new Error("Response not received in time")
  }

  // Typing animation component
  const TypingAnimation = () => (
    <div className="flex items-center space-x-1">
      <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0s" }}></div>
      <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
    </div>
  )

  // Render assistant response with emoji/text icons, bold up to second period, and increased spacing
  const renderAssistantResponse = (responseText) => {
    if (!responseText) return null

    // Define known text-based icon indicators
    const textIcons = ["Iltimos"]

    // Split response into sentences, preserving newlines for structure
    const sentences = responseText.split(/\n+/).filter(s => s.trim())

    return sentences.map((sentence, index) => {
      // Check for emoji or text icon at the start
      let icon = null
      let cleanSentence = sentence
      let hasIcon = false

      // Emoji detection
      const emojiMatch = sentence.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u)
      if (emojiMatch) {
        icon = <span className="mr-2 text-gray-400">{emojiMatch[1]}</span>
        cleanSentence = sentence.replace(emojiMatch[1], "").trim()
        hasIcon = true
      } else {
        // Text icon detection
      }

      // Find text up to the second period for bolding
      let boldText = cleanSentence
      let regularText = ""
      if (hasIcon) {
        const periods = cleanSentence.split(".").filter(s => s.trim())
        if (periods.length >= 2) {
          boldText = `${periods[0]}.${periods[1]}.`
          regularText = periods.slice(2).join(".").trim()
        }
      }

      return (
        <div key={index} className={`flex ${hasIcon ? "mb-4" : "mb-2"}`}>
          {icon && <div className="mb-1">{icon}</div>}
          <div>
            {hasIcon && boldText && (
              <Text className="!text-white" strong>
                {boldText}
              </Text>
            )}
            {regularText && (
              <Text className="!text-gray-300">
                {regularText}
              </Text>
            )}
            {!hasIcon && (
              <Text className="!text-gray-300">
                {cleanSentence}
              </Text>
            )}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="bg-gray-900 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-800 px-4 py-3 border-gray-700 border-b">
        <div className="flex items-center space-x-2">
          <Title level={4} className="!mb-0 !text-white">
            ChatGPT
          </Title>
        </div>
        <div className="space-x-2">
          <Button type="text" className="!text-gray-300 hover:!text-white">
            Log in
          </Button>
          <Button type="primary" className="!bg-green-600 hover:!bg-green-700 !border-green-600">
            Sign up for free
          </Button>
        </div>
      </div>

      <Layout className="bg-gray-900 h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <Sider width={300} className="!bg-gray-800 border-gray-700 border-r">
          <div className="p-4 h-full overflow-y-auto">
            <div className="mb-4 text-red-400 text-sm">PDF</div>
            <div className="space-y-2">
              <div className="flex justify-center items-center bg-gray-700 border-2 border-gray-600 border-dashed rounded h-32">
                <Text className="!text-gray-400 text-center">Upload PDF</Text>
              </div>
            </div>
          </div>
        </Sider>

        {/* Main Content */}
        <Content className="flex flex-col h-[calc(100vh-64px)]">
          <div className="flex flex-col flex-1 p-8">
            <div
              className="flex-1 overflow-y-auto"
              ref={chatContainerRef}
              style={{ maxHeight: "calc(100vh - 200px)" }}
            >
              {chatHistory.map((chat, index) => (
                <div key={index} className="mb-4 max-w-[80%]">
                  {/* User Message */}
                  <div className="bg-gray-700 ml-auto p-3 rounded-lg">
                    <Text className="!text-white">You: {chat.request}</Text>
                  </div>
                  {/* Assistant Response */}
                  {chat.response && (
                    <div className="bg-gray-600 mt-2 mr-auto p-3 rounded-lg">
                      {renderAssistantResponse(displayedResponse[chat.request] || chat.response)}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="bg-gray-600 mr-auto p-3 rounded-lg max-w-[80%]">
                  <TypingAnimation />
                </div>
              )}
            </div>

            <div className="mt-4 w-full max-w-2xl">
              <div className="flex flex-col space-y-2">
                <TextArea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask anything"
                  className="!bg-gray-700 !border-gray-600 !rounded-lg !text-white placeholder:!text-gray-400"
                  style={{
                    minHeight: "60px",
                    resize: "none",
                  }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    className="!p-1 !text-gray-400 hover:!text-white"
                    size="small"
                  />
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    className="!p-1 !text-gray-400 hover:!text-white"
                    size="small"
                  />
                  <Button
                    type="text"
                    icon={<AudioOutlined />}
                    className="!p-1 !text-gray-400 hover:!text-white"
                    size="small"
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    className="!bg-green-600 hover:!bg-green-700 !p-1 !border-green-600"
                    size="small"
                    onClick={handleSend}
                    disabled={!message.trim() || loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-gray-700 border-t text-gray-400 text-xs text-center">
            By messaging ChatGPT, you agree to our{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Terms
            </a>{" "}
            and have read our{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Privacy Policy
            </a>
            .
          </div>
        </Content>

        {/* Right Sidebar */}
        <Sider width={300} className="!bg-gray-800 border-gray-700 border-l">
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center mb-4 text-red-400 text-sm">
              Chat History
              <Button
                type="text"
                className="ml-2 !text-gray-300 hover:!text-white"
                onClick={createChatRoom}
                disabled={loading}
              >
                New Chat
              </Button>
            </div>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`bg-gray-700 hover:bg-gray-600 p-3 rounded transition-colors cursor-pointer ${chatRoomId === conv.id ? "bg-gray-600" : ""
                    }`}
                  onClick={() => fetchChatHistory(conv.id)}
                >
                  <Text className="!text-gray-300 text-sm">{conv.title}</Text>
                </div>
              ))}
            </div>
          </div>
        </Sider>
      </Layout>
    </div>
  )
}

export default App