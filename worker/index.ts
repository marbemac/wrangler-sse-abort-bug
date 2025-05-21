export default {
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/sse-test") {
      let intervalId: ReturnType<typeof setInterval>;

      req.signal.addEventListener("abort", () => {
        // This is never called
        console.log("Request aborted!");
      });

      const stream = new ReadableStream({
        start(controller) {
          console.log("SSE: Client connected");

          intervalId = setInterval(() => {
            const message = `data: ${new Date().toISOString()}\n\n`;
            try {
              console.log("SSE: Enqueuing data", message);
              controller.enqueue(new TextEncoder().encode(message));
            } catch (e) {
              // This catch is a fallback, primary disconnect detection is via 'cancel'
              console.error("SSE: Error enqueuing data:", e);
              clearInterval(intervalId);

              // Attempt to close if not already closed by 'cancel'
              try {
                console.log("SSE: attempting manual close");
                controller.close();
              } catch {
                console.error("SSE: Error closing stream:", e);
              }
            }
          }, 1000);
        },

        cancel(reason) {
          // This is never called
          console.log(
            "SSE: Client disconnected (stream cancelled). Reason:",
            reason
          );
          clearInterval(intervalId);
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
