import { useState } from "react";
import api from "../utils/api";

export default function Dashboard() {
    const [topic, setTopic] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        if (!topic) return alert("Please enter a topic!");
        setLoading(true);
        setResult(null);

        try {
            const res = await api.post("/ai/ai-content", { topic });
            console.log(res,'ai')
            setResult(res.data);
        } catch (err) {
            console.log("AI Generation Failed!");
        } finally {
            setLoading(false);
        }
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center p-6">
            <h1 className="text-4xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ⚡ AI Content Planner
            </h1>

            <div className="w-full max-w-2xl bg-gray-800/60 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-700 hover:shadow-blue-600/30 transition-all duration-300">
                <input
                    type="text"
                    placeholder="Enter your topic (e.g. Fitness Motivation)..."
                    className="w-full p-3 bg-gray-900 rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-200"
                    onChange={(e) => setTopic(e.target.value)}
                />

                <button
                    onClick={generate}
                    disabled={loading}
                    className="mt-4 w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all duration-300 flex justify-center items-center"
                >
                    {loading ? <Spinner /> : "Generate Content Plan"}
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="w-full max-w-3xl mt-10 grid gap-6">
                    <ResultCard
                        title="💡 Ideas"
                        content={result.ideas?.join("\n")}
                        copyText={copyText}
                    />
                    <ResultCard
                        title="✍️ Captions"
                        content={result.captions?.join("\n")}
                        copyText={copyText}
                    />
                    <ResultCard
                        title="🏷️ Hashtags"
                        content={result.hashtags?.join(" ")}
                        copyText={copyText}
                    />
                    <ResultCard
                        title="📖 Blog Outline"
                        content={result.outline}
                        copyText={copyText}
                    />
                </div>
            )}
        </div>
    );
}

function ResultCard({ title, content, copyText }) {
    return (
        <div className="bg-gray-800/70 backdrop-blur-md p-5 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-blue-400">{title}</h2>
                <button
                    onClick={() => copyText(content)}
                    className="text-sm bg-blue-600/80 px-3 py-1 rounded-md hover:bg-blue-500 transition-all"
                >
                    Copy
                </button>
            </div>
            <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
                {content || "No data"}
            </pre>
        </div>
    );
}

function Spinner() {
    return (
        <div className="flex justify-center items-center space-x-2">
            <div className="w-4 h-4 rounded-full animate-bounce bg-blue-400"></div>
            <div className="w-4 h-4 rounded-full animate-bounce bg-purple-400 animation-delay-200"></div>
            <div className="w-4 h-4 rounded-full animate-bounce bg-pink-400 animation-delay-400"></div>
        </div>
    );
}
