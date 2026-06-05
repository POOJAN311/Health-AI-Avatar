// mockResponses.js
// Simulated backend responses for the Health AI Avatar prototype.
// In production, these would come from the RAG/LLM backend API.

export const mockResponses = [
    {
        id: 1,
        trigger_keywords: ["headache", "head pain", "migraine"],
        answer:
            "Headaches can have many causes including tension, dehydration, or stress. For occasional headaches, rest, hydration, and over-the-counter pain relief are commonly recommended. However, if your headache is severe, sudden, or accompanied by other symptoms, please consult a healthcare professional.",
        evidence_used: [
            { document_id: "doc_3", chunk_id: "chunk_7" },
            { document_id: "doc_5", chunk_id: "chunk_2" },
        ],
        guardrail_triggered: false,
        emotion_state: "supportive",
        safety_message: null,
    },
    {
        id: 2,
        trigger_keywords: ["chest pain", "heart attack", "can't breathe", "cannot breathe", "shortness of breath", "stroke"],
        answer:
            "Your symptoms may require urgent medical attention. Chest pain and difficulty breathing can be signs of a serious cardiac or respiratory condition. Please contact emergency services (911) or go to your nearest emergency room immediately. Do not wait.",
        evidence_used: [],
        guardrail_triggered: true,
        emotion_state: "warning",
        safety_message:
            "⚠️ This may be a medical emergency. Call 911 or your local emergency number immediately.",
    },
    {
        id: 3,
        trigger_keywords: ["diabetes", "blood sugar", "insulin", "glucose"],
        answer:
            "Diabetes is a chronic condition that affects how your body processes blood sugar. Management typically involves lifestyle changes, monitoring blood glucose levels, and in some cases medication or insulin therapy. This is general educational information — please discuss your specific treatment options and targets with your clinician.",
        evidence_used: [
            { document_id: "doc_1", chunk_id: "chunk_2" },
        ],
        guardrail_triggered: false,
        emotion_state: "supportive",
        safety_message: null,
    },
    {
        id: 4,
        trigger_keywords: ["medication", "medicine", "dosage", "side effects", "drug"],
        answer:
            "Medication guidelines vary widely depending on the specific drug, your health conditions, and other medications you may be taking. I can provide general educational information, but dosage and side effect questions should always be reviewed with your prescribing physician or pharmacist before making any changes.",
        evidence_used: [
            { document_id: "doc_2", chunk_id: "chunk_4" },
            { document_id: "doc_4", chunk_id: "chunk_9" },
        ],
        guardrail_triggered: false,
        emotion_state: "supportive",
        safety_message: null,
    },
    {
        id: 5,
        trigger_keywords: ["suicide", "kill myself", "self harm", "hurt myself", "end my life"],
        answer:
            "It sounds like you may be going through an extremely difficult time. Please know that support is available right now. Reach out to a crisis helpline immediately — in Canada, call or text 988 (Suicide Crisis Helpline). You do not have to face this alone.",
        evidence_used: [],
        guardrail_triggered: true,
        emotion_state: "warning",
        safety_message:
            "⚠️ If you are in crisis, please call or text 988 (Canada) or 911 immediately. Help is available.",
    },
    {
        id: 6,
        trigger_keywords: ["sleep", "insomnia", "can't sleep", "tired", "fatigue"],
        answer:
            "Sleep difficulties are very common and can be influenced by stress, lifestyle habits, diet, and underlying health conditions. Good sleep hygiene practices — such as a consistent sleep schedule, limiting screen time before bed, and avoiding caffeine in the evening — can help. If insomnia persists for more than a few weeks, it is worth speaking with your healthcare provider.",
        evidence_used: [
            { document_id: "doc_6", chunk_id: "chunk_1" },
        ],
        guardrail_triggered: false,
        emotion_state: "supportive",
        safety_message: null,
    },
    {
        id: 7,
        trigger_keywords: ["blood pressure", "hypertension", "high blood pressure"],
        answer:
            "High blood pressure (hypertension) is a common condition that, if unmanaged, can increase the risk of heart disease and stroke. Lifestyle factors such as diet, exercise, salt intake, and stress management play an important role. Medication may also be prescribed depending on your readings. Regular monitoring and follow-up with your doctor are essential.",
        evidence_used: [
            { document_id: "doc_1", chunk_id: "chunk_5" },
            { document_id: "doc_3", chunk_id: "chunk_3" },
        ],
        guardrail_triggered: false,
        emotion_state: "supportive",
        safety_message: null,
    },
    {
        id: 8,
        trigger_keywords: [], // default fallback — matches anything not caught above
        answer:
            "Thank you for your question. I can provide general health education information, but I am not a substitute for professional medical advice. For personalised guidance, please consult your healthcare provider or a qualified clinician.",
        evidence_used: [],
        guardrail_triggered: false,
        emotion_state: "supportive",
        safety_message: null,
    },
];

/**
 * getResponse(userMessage)

 * @param {string} userMessage - The text typed or transcribed by the user.
 * @returns {object} A single mock response object.
 */
export function getResponse(userMessage) {
    const lower = userMessage.toLowerCase();

    for (const response of mockResponses) {
        if (
            response.trigger_keywords.length > 0 &&
            response.trigger_keywords.some((kw) => lower.includes(kw))
        ) {
            return response;
        }
    }

    // Return the default fallback
    return mockResponses[mockResponses.length - 1];
}