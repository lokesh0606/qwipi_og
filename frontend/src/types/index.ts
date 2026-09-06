export interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at?: string;
    isError?: boolean;
}

export interface Conversation {
    id: string;
    title: string;
    updated_at: string;
}

export interface ConversationDetail extends Conversation {
    messages: Message[];
}

export interface User {
    id: string;
    email: string;
    is_admin?: boolean;
    created_at: string;
}
