import { useState, useEffect, useRef } from 'react'

export function useWebSocket(url) {
  const [connectionStatus, setConnectionStatus] = useState('Connecting')
  const [lastMessage, setLastMessage] = useState(null)
  const ws = useRef(null)

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setConnectionStatus('Connected')
      }

      ws.current.onmessage = (event) => {
        setLastMessage(event)
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('Error')
      }

      ws.current.onclose = () => {
        setConnectionStatus('Disconnected')
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000)
      }
    }

    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url])

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message)
    }
  }

  return {
    connectionStatus,
    lastMessage,
    sendMessage,
  }
}