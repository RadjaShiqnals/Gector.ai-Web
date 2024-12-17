import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_API_KEY,
  baseURL: process.env.REACT_APP_API_ENDPOINT,
  dangerouslyAllowBrowser: true,
});

const systemMessage = {
  role: "system",
  content: `You are a helpful AI assistant with expertise in gaming and anime.
            You should respond in a friendly, enthusiastic manner while maintaining accuracy.
            You can use emoji occasionally to make responses more engaging.
            Please keep responses concise unless asked for detailed explanations.`,
};

export const sendMessageToAI = async (input, setMessages, setInput, setIsLoading, setIsGenerating) => {
  if (!input.trim()) return; // Skip empty messages

  // Add user's message to the chat
  const userMessage = { sender: "user", text: input };
  setMessages((prev) => [...prev, userMessage]);
  setInput(""); // Clear input
  setIsLoading(true);
  setIsGenerating(true);

  try {
    const stream = await openai.chat.completions.create({
      model: "Gector-1",
      messages: [
        systemMessage,
        { role: "user", content: input },
      ],
      temperature: 1.2,
      top_k: 0,
      top_p: 1,
      min_p: 0.1,
      typical_p: 1,
      top_a: 0,
      repetition_penalty: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 120,
      stream: true,
    });

    let aiMessage = { sender: "ai", text: "" };

    // Use for-await-of to handle streamed responses
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      aiMessage.text += delta;
      
      setIsGenerating(false);

      // Update the AI's message in real time
      setMessages((prev) => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.sender === "ai") {
          lastMessage.text = aiMessage.text;
        } else {
          updatedMessages.push(aiMessage);
        }
        return updatedMessages;
      });
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);

    // Check for specific error (503 Service Unavailable) or other signs of server overload
    if (error.response && error.response.status === 503) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, the server is busy. Please try again later!" },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, something went wrong!" },
      ]);
    }
  } finally {
    setIsLoading(false);
  }
};