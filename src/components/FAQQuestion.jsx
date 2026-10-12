import { useState } from "react";

export default function FAQQuestion({ question, answer }) {
    const [collapsed, setCollapsed] = useState(true);
    return (
        <div className="faq-question">
            <div className="faq-question-header">
                <button className="faq-question-collapse" onClick={() => setCollapsed(!collapsed)}>{collapsed ? "+" : "-"}</button>
                <span className="faq-question-question">{question}</span>
            </div>
            <div className={"faq-question-body" + (collapsed ? " no-display" : "")}>
                <span className="faq-question-answer">{answer}</span>
            </div>
        </div>
    )
}