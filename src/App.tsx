import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function consumeSSE() {
      try {
        const response = await fetch("http://localhost:5173/sse-test", {
          signal,
        });
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("SSE stream finished.");
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          console.log("SSE data:", chunk);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("SSE fetch aborted by client.");
        } else {
          console.error("Error consuming SSE:", error);
        }
      }
    }

    void consumeSSE();

    const timeoutId = setTimeout(() => {
      console.log("Aborting SSE fetch after 5 seconds.");
      controller.abort();
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      // Ensure controller is aborted if component unmounts before timeout
      if (!signal.aborted) {
        controller.abort();
      }
    };
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://workers.cloudflare.com/" target="_blank">
          <img
            src={cloudflareLogo}
            className="logo cloudflare"
            alt="Cloudflare logo"
          />
        </a>
      </div>
      <h1>Vite + React + Cloudflare</h1>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="increment"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button
          onClick={() => {
            fetch("/api/")
              .then((res) => res.json() as Promise<{ name: string }>)
              .then((data) => setName(data.name));
          }}
          aria-label="get name"
        >
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
