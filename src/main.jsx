import React from "react"
import ReactDOM from "react-dom/client"
import { ConfigProvider, theme } from "antd"
import App from "./App.jsx"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#10b981",
          colorBgContainer: "#1f2937",
          colorBgElevated: "#374151",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
